"""Quick smoke test: verify InsightFace embedding + matching for vatsal_vadgama."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from model import get_embedding_insightface, apply_clahe
import cv2, pickle, numpy as np

# Load test image
img = cv2.imread(os.path.join('..', 'dataset_cleaned', 'vatsal_vadgama', 'frontal', 'vatsal_vadgama_frontal_001.jpg'))
if img is None:
    print('ERROR: test image not found')
    sys.exit(1)

crop = apply_clahe(img)

# Test embedding speed
t0 = time.perf_counter()
emb = get_embedding_insightface(crop)
elapsed = (time.perf_counter() - t0) * 1000
print(f'Embedding dim: {len(emb)}')
print(f'Time: {elapsed:.1f}ms')

# Test matching
with open('data/encodings_InsightFace.pickle', 'rb') as f:
    d = pickle.load(f)

q = np.array(emb, dtype=np.float32)
mat = np.array(d['encodings'], dtype=np.float32)
norms = np.linalg.norm(mat, axis=1, keepdims=True)
mat = mat / np.where(norms == 0, 1, norms)
sims = mat @ q
idx = int(np.argmax(sims))
match_name = d['names'][idx]
match_sim = float(sims[idx])

print(f'Match: {match_name}  (similarity={match_sim:.4f})')
if match_name == 'vatsal_vadgama' and match_sim > 0.65:
    print('PASS - InsightFace correctly identifies vatsal_vadgama')
else:
    print('FAIL - InsightFace did not match vatsal_vadgama')
