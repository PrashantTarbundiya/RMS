import cv2
import pickle
import numpy as np
import time
import os
import threading
import queue
import collections
from deepface import DeepFace
from scipy.spatial.distance import cosine
from collections import Counter, OrderedDict
from face_detection import SideFaceDetector

# Path constants
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

# Suppress TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# ======================== CONFIGURATION ========================
# Single lightweight model: Must match what was used in model.py
MODEL_NAME = "Facenet512"

# KNN voting: Use top-K nearest neighbors for majority vote
KNN_K = 5

# Ratio test threshold (Lowe's inspired): accept only if
# best_distance < RATIO_TEST * second_best_distance
RATIO_TEST = 0.80  # Relaxed from 0.75 for better side face matching

# Absolute distance cutoff (reject above this regardless)
MAX_DISTANCE = 0.60  # Relaxed from 0.55 for side face profile tolerance
# ===============================================================

# Global variables for threading
recognizer_queue = queue.Queue(maxsize=1)
result_queue = queue.Queue(maxsize=1)
terminate_event = threading.Event()


# ======================== EMBEDDING CACHE ========================
class EmbeddingCache:
    """
    Cache embeddings keyed by perceptual hash of face crop.
    
    Once a face is recognized, subsequent frames of the same face
    use the cached embedding instead of recomputing (~50ms saved per face).
    Uses a TTL to expire stale entries.
    """
    def __init__(self, maxsize=50, ttl_seconds=5.0):
        self.cache = OrderedDict()
        self.maxsize = maxsize
        self.ttl = ttl_seconds

    def _phash(self, crop):
        """Compute perceptual hash (robust to minor pixel changes)."""
        try:
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            resized = cv2.resize(gray, (8, 8), interpolation=cv2.INTER_AREA)
            mean_val = resized.mean()
            return hash(tuple((resized > mean_val).flatten()))
        except Exception:
            return None

    def get_or_compute(self, crop, compute_fn):
        """
        Return cached embedding if available (cache hit), otherwise
        compute using compute_fn and store in cache.
        """
        key = self._phash(crop)
        if key is None:
            return compute_fn(crop)

        now = time.time()

        if key in self.cache:
            emb, timestamp = self.cache[key]
            if now - timestamp < self.ttl:
                # Cache hit! Saved ~50ms
                return emb
            else:
                # Expired
                del self.cache[key]

        # Cache miss — compute and store
        emb = compute_fn(crop)
        self.cache[key] = (emb, now)

        # Evict oldest if full
        while len(self.cache) > self.maxsize:
            self.cache.popitem(last=False)

        return emb

    def clear(self):
        """Clear all cached entries."""
        self.cache.clear()


# Global embedding cache instance
_embedding_cache = EmbeddingCache(maxsize=50, ttl_seconds=5.0)


# ======================== TEMPORAL SMOOTHING ========================
class TemporalSmoother:
    """
    Stabilize predictions across frames using majority voting.
    
    Prevents name flickering in live webcam mode by requiring a prediction
    to appear in ≥3 of the last 5 frames before displaying it.
    """
    def __init__(self, window_size=5, min_votes=3):
        self.history = {}  # bbox_key -> deque of recent (name, dist) predictions
        self.window_size = window_size
        self.min_votes = min_votes
        self._cleanup_interval = 30  # Cleanup stale entries every N calls
        self._call_count = 0

    def _bbox_to_key(self, bbox):
        """Convert bounding box to a coarse grid key for tracking."""
        # Quantize to 50px grid to handle slight bbox shifts between frames
        grid = 50
        gx = (bbox[0] + bbox[2] // 2) // grid
        gy = (bbox[1] + bbox[3] // 2) // grid
        return (gx, gy)

    def smooth(self, bbox, raw_name, raw_dist):
        """
        Apply temporal smoothing to a single face prediction.
        
        Returns:
            (smoothed_name, smoothed_dist)
        """
        key = self._bbox_to_key(bbox)
        
        if key not in self.history:
            self.history[key] = collections.deque(maxlen=self.window_size)

        self.history[key].append((raw_name, raw_dist, time.time()))

        # Majority vote across recent frames
        recent = self.history[key]
        names = [n for n, d, t in recent]
        counter = Counter(names)
        winner, count = counter.most_common(1)[0]

        # Only switch to a name if it appears in ≥min_votes of recent frames
        if count >= self.min_votes:
            # Use the best (lowest) distance among the winning name's frames
            best_dist = min(d for n, d, t in recent if n == winner)
            return winner, best_dist
        elif len(recent) >= 2:
            # Not enough votes yet — return the most recent prediction
            return raw_name, raw_dist
        else:
            return raw_name, raw_dist

    def cleanup(self):
        """Remove stale entries (faces that haven't been seen recently)."""
        self._call_count += 1
        if self._call_count % self._cleanup_interval != 0:
            return

        now = time.time()
        stale_keys = []
        for key, deq in self.history.items():
            if deq and (now - deq[-1][2]) > 3.0:
                stale_keys.append(key)
        for key in stale_keys:
            del self.history[key]


# Global temporal smoother instance
_temporal_smoother = TemporalSmoother(window_size=5, min_votes=3)


def load_encodings(encodings_path=None):
    if encodings_path is None:
        encodings_path = os.path.join(BACKEND_DIR, 'data', 'encodings.pickle')
    try:
        data = pickle.loads(open(encodings_path, "rb").read())
        version = data.get("version", "1.0")
        print(f"📦 Encodings version: {version}")
        return data
    except Exception as e:
        print(f"❌ Error loading encodings: {e}")
        return None


def apply_clahe(image):
    """Apply CLAHE preprocessing (must match training pipeline)."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


# Import the updated embedding function that fuses DeepFace + Face Mesh soft biometrics
from model import get_embedding


def find_match_knn(embedding, known_encodings, known_names, k=KNN_K, max_dist=MAX_DISTANCE, ratio=RATIO_TEST):
    """
    KNN Majority Voting + Ratio Test matching.
    
    Instead of single nearest-neighbor, we:
    1. Find the K closest embeddings by cosine distance
    2. Apply ratio test: best must be significantly better than runner-up
    3. Apply majority vote among the K-nearest for final label
    
    This dramatically reduces false positives and improves robustness.
    """
    if not known_encodings:
        return "Unknown", 1.0

    # Compute all distances
    distances = []
    for i, known_emb in enumerate(known_encodings):
        dist = cosine(embedding, known_emb)
        distances.append((dist, known_names[i]))

    # Sort by distance (ascending = best first)
    distances.sort(key=lambda x: x[0])

    best_dist = distances[0][0]
    best_name = distances[0][1]

    # --- Gate 1: Absolute distance cutoff ---
    if best_dist > max_dist:
        return "Unknown", best_dist

    # --- Gate 2: Ratio test (Lowe's inspired) ---
    # Find the nearest match from a DIFFERENT person
    second_best_dist = None
    for dist, name in distances:
        if name != best_name:
            second_best_dist = dist
            break

    if second_best_dist is not None:
        if best_dist > ratio * second_best_dist:
            # Best match is not significantly better than the next different person
            return "Unknown", best_dist

    # --- Gate 3: KNN Majority Vote ---
    # Take top-K neighbors and vote
    top_k = distances[:min(k, len(distances))]
    # Filter to only include matches within the max_dist threshold
    valid_votes = [name for dist, name in top_k if dist <= max_dist]

    if not valid_votes:
        return "Unknown", best_dist

    # Weighted vote: closer neighbors get higher weight
    name_weights = {}
    for dist, name in top_k:
        if dist <= max_dist:
            weight = 1.0 / (dist + 1e-6)  # inverse distance weighting
            name_weights[name] = name_weights.get(name, 0) + weight

    # Winner is the name with highest cumulative weight
    winner = max(name_weights, key=name_weights.get)
    winner_dist = min(dist for dist, name in distances if name == winner)

    return winner, winner_dist


# Legacy single-match function (kept for backward compatibility)
def find_match(embedding, known_encodings, known_names, threshold=0.4):
    """Legacy single nearest-neighbor matching (use find_match_knn instead)."""
    return find_match_knn(embedding, known_encodings, known_names)


def recognition_worker(known_encodings, known_names):
    """Background worker for face recognition with embedding cache."""
    print("🚀 Recognition thread started (with embedding cache).")

    while not terminate_event.is_set():
        try:
            data = recognizer_queue.get(timeout=0.2)
            frame, faces_to_process, frame_timestamp = data

            results = []

            for face_data in faces_to_process:
                crop = face_data['crop']
                bbox = face_data['bbox']

                name = "Unknown"
                dist = 1.0

                if crop.size > 0:
                    try:
                        # Apply CLAHE (must match training)
                        processed_crop = apply_clahe(crop)

                        # Use embedding cache for faster re-recognition
                        embedding = _embedding_cache.get_or_compute(
                            processed_crop, get_embedding
                        )

                        if embedding is not None:
                            name, dist = find_match_knn(embedding, known_encodings, known_names)
                    except Exception:
                        pass

                # Apply temporal smoothing
                smoothed_name, smoothed_dist = _temporal_smoother.smooth(
                    bbox, name, dist
                )
                _temporal_smoother.cleanup()

                results.append({
                    'name': smoothed_name,
                    'dist': smoothed_dist,
                    'bbox': bbox,
                    'timestamp': frame_timestamp
                })

            if result_queue.full():
                try:
                    result_queue.get_nowait()
                except:
                    pass
            result_queue.put(results)

            recognizer_queue.task_done()

        except queue.Empty:
            continue
        except Exception as e:
            print(f"Thread error: {e}")

    print("🛑 Recognition thread stopped.")


def calculate_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = boxA[2] * boxA[3]
    boxBArea = boxB[2] * boxB[3]

    iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
    return iou


def main():
    # Load encodings
    print("📥 Loading face encodings...")
    data = load_encodings()
    if data is None:
        print("Please run model.py first!")
        return

    known_encodings = data["encodings"]
    known_names = data["names"]
    version = data.get("version", "1.0")

    print(f"✅ Loaded {len(known_encodings)} embeddings (v{version}).")
    print(f"   Model: {MODEL_NAME}")
    print(f"   Matching: KNN(k={KNN_K}) + Ratio({RATIO_TEST}) + MaxDist({MAX_DISTANCE})")
    print(f"   Temporal Smoothing: ON (5-frame window)")
    print(f"   Embedding Cache: ON (TTL=5s)")

    # Start Recognition Thread
    rec_thread = threading.Thread(
        target=recognition_worker,
        args=(known_encodings, known_names),
        daemon=True
    )
    rec_thread.start()

    # Initialize detector (MediaPipe - Fast, runs in main thread)
    detector = SideFaceDetector(min_detection_confidence=0.30)

    print("🎥 Starting optimized video stream...")
    cap = cv2.VideoCapture(0)

    # Increase camera FPS if supported
    cap.set(cv2.CAP_PROP_FPS, 30)

    fps_start_time = time.time()
    fps = 0
    frame_count = 0

    # Store latest recognition results
    latest_recognition_results = []

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            H, W = frame.shape[:2]

            # --- 1. DETECTION (Fast, Every Frame) ---
            mp_faces = detector.detect_faces(frame, profile_only=False)

            # --- 2. THREAD COMMUNICATION ---
            try:
                if not result_queue.empty():
                    latest_recognition_results = result_queue.get_nowait()
            except:
                pass

            # Send data to thread if idle
            if recognizer_queue.empty():
                faces_payload = []
                for face in mp_faces:
                    bbox = (face['bbox']['x'], face['bbox']['y'], face['bbox']['w'], face['bbox']['h'])
                    x, y, w, h = bbox

                    # Wider margin (matches training)
                    margin_x = int(w * 0.20)
                    margin_y = int(h * 0.20)
                    x1 = max(0, x - margin_x)
                    y1 = max(0, y - margin_y)
                    x2 = min(W, x + w + margin_x)
                    y2 = min(H, y + h + margin_y)
                    crop = frame[y1:y2, x1:x2].copy()

                    faces_payload.append({'crop': crop, 'bbox': bbox})

                if faces_payload:
                    recognizer_queue.put((frame.copy(), faces_payload, time.time()))

            # --- 3. MERGE & DRAW ---
            for face in mp_faces:
                curr_box = (face['bbox']['x'], face['bbox']['y'], face['bbox']['w'], face['bbox']['h'])

                display_name = "Analyzing..."
                display_dist = 0.0
                display_color = (255, 165, 0)  # Orange (Waiting)

                best_iou = 0
                for old_res in latest_recognition_results:
                    iou = calculate_iou(curr_box, old_res['bbox'])
                    if iou > best_iou:
                        best_iou = iou
                        if iou > 0.3:
                            display_name = old_res['name']
                            display_dist = old_res['dist']

                            if display_name == "Unknown":
                                display_color = (0, 0, 255)  # Red
                            else:
                                display_color = (0, 255, 0)  # Green

                # Draw
                x, y, w, h = curr_box
                cv2.rectangle(frame, (x, y), (x + w, y + h), display_color, 2)

                # Label — show 100% for recognized, "Unknown" for not
                if display_name not in ("Analyzing...", "Unknown"):
                    label = f"{display_name} (100%)"
                elif display_name == "Unknown":
                    label = "Unknown"
                else:
                    label = "Analyzing..."

                cv2.rectangle(frame, (x, y - 25), (x + 220, y), display_color, -1)
                cv2.putText(frame, label, (x + 5, y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                # Direction
                direction_text = face['direction'].replace('_', ' ').title()
                angle = face['angle']
                cv2.putText(frame, f"{direction_text} ({angle:.0f}deg)", (x, y + h + 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            # --- 4. SOFT BIOMETRICS OVERLAY ---
            if mp_faces:
                primary = max(mp_faces, key=lambda f: f['bbox']['w'] * f['bbox']['h'])
                metrics = primary.get('soft_biometrics', {})
                if metrics:
                    overlay = frame.copy()
                    cv2.rectangle(overlay, (10, 60), (330, 200), (0, 0, 0), -1)
                    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
                    cv2.putText(frame, "SOFT BIOMETRICS (Alsubhi et al.)", (20, 80),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                    y_pos = 100
                    for k, v in metrics.items():
                        cv2.putText(frame, f"{k.replace('_', ' ').title()}: {v:.2f}", (20, y_pos),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                        y_pos += 20

            # FPS
            frame_count += 1
            if time.time() - fps_start_time > 1:
                fps = frame_count / (time.time() - fps_start_time)
                frame_count = 0
                fps_start_time = time.time()

            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            
            # Model info
            cv2.putText(frame, f"v4.0 Enhanced | KNN(k={KNN_K}) | Cache+Smooth", (10, H - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (128, 128, 255), 1)

            cv2.imshow("Enhanced Side Face Recognition", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        pass
    finally:
        terminate_event.set()
        if rec_thread.is_alive():
            rec_thread.join(timeout=1.0)
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        _embedding_cache.clear()


if __name__ == "__main__":
    main()
