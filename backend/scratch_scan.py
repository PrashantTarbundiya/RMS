"""
Quick profile: measure actual time breakdown per image for each model.
Runs 10 images and breaks down: transform, CLAHE, embed, match.
"""
import os, sys, cv2, time, glob
import numpy as np

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
sys.path.insert(0, '.')

# Load a few test crops
DATASET = os.path.join('..', 'dataset_cleaned')
crops = []
for person in sorted(os.listdir(DATASET))[:5]:
    pdir = os.path.join(DATASET, person)
    if not os.path.isdir(pdir): continue
    for root, _, files in os.walk(pdir):
        for f in sorted(files)[:2]:
            if f.lower().endswith(('.jpg','.png')):
                img = cv2.imread(os.path.join(root, f))
                if img is not None:
                    crops.append((person, img))
                    break
        if crops and crops[-1][0] == person: break

print(f"Loaded {len(crops)} test crops")

# Pre-build reference matrices
import pickle
with open('data/encodings.pickle','rb') as f: d = pickle.load(f)
ref_enc = d['encodings']; ref_names = d['names']
mat = np.array(ref_enc, dtype=np.float32)
norms = np.linalg.norm(mat, axis=1, keepdims=True)
ref_matrix = mat / np.where(norms==0, 1, norms)
print(f"Reference matrix: {ref_matrix.shape}")

# CLAHE function
def apply_clahe(img):
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        cl = cv2.createCLAHE(2.0, (8,8))
        l2 = cl.apply(l)
        return cv2.cvtColor(cv2.merge([l2,a,b]), cv2.COLOR_LAB2BGR)
    except: return img

# Resolution sim
def sim_res(img, px=80):
    h,w = img.shape[:2]
    if w <= px: return img
    s = px/w
    small = cv2.resize(img, (max(1,int(w*s)), max(1,int(h*s))), interpolation=cv2.INTER_AREA)
    return cv2.resize(small, (w,h), interpolation=cv2.INTER_LINEAR)

# Match
def match(q_emb):
    if q_emb is None: return 'Unknown', 0.0
    q = np.array(q_emb, dtype=np.float32)
    q = q / max(np.linalg.norm(q), 1e-8)
    sims = ref_matrix @ q
    idx = int(np.argmax(sims)); best = float(sims[idx])
    return (ref_names[idx] if best >= 0.65 else 'Unknown'), best

print("\n=== TIMING BREAKDOWN (10 images) ===\n")

# --- Facenet512 ---
print("[ Facenet512 ]")
from deepface import DeepFace
# Warmup
_=DeepFace.represent(crops[0][1], model_name='Facenet512', enforce_detection=False, detector_backend='skip', align=False)
t_transform=0; t_clahe=0; t_embed=0; t_match=0
for person, img in crops:
    t0=time.perf_counter()
    c = sim_res(img.copy(), 80)
    t_transform += time.perf_counter()-t0

    t0=time.perf_counter()
    c = apply_clahe(c)
    t_clahe += time.perf_counter()-t0

    t0=time.perf_counter()
    r=DeepFace.represent(c, model_name='Facenet512', enforce_detection=False, detector_backend='skip', align=False)
    emb = r[0]['embedding'] if r else None
    t_embed += time.perf_counter()-t0

    t0=time.perf_counter()
    match(emb)
    t_match += time.perf_counter()-t0

n = len(crops)
print(f"  transform : {t_transform/n*1000:.1f} ms/img")
print(f"  CLAHE     : {t_clahe/n*1000:.1f} ms/img")
print(f"  embed     : {t_embed/n*1000:.1f} ms/img")
print(f"  match     : {t_match/n*1000:.3f} ms/img")
print(f"  TOTAL     : {(t_transform+t_clahe+t_embed+t_match)/n*1000:.1f} ms/img")
print(f"  → 207 imgs: {(t_transform+t_clahe+t_embed+t_match)/n*207:.1f} sec")
print(f"  → 21 cond : {(t_transform+t_clahe+t_embed+t_match)/n*207*21/60:.1f} min (FN512 only)")

# --- InsightFace ---
print("\n[ InsightFace ]")
import onnxruntime as ort
mp = os.path.join(os.path.expanduser('~'),'.insightface','models','buffalo_sc','w600k_mbf.onnx')
so = ort.SessionOptions(); so.intra_op_num_threads=os.cpu_count()
so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL; so.log_severity_level=3
sess = ort.InferenceSession(mp, providers=['CPUExecutionProvider'], sess_options=so)
# Warmup
dummy = np.zeros((1,3,112,112),np.float32); sess.run(None, {sess.get_inputs()[0].name: dummy})

with open('data/encodings_InsightFace.pickle','rb') as f: d2=pickle.load(f)
m2 = np.array(d2['encodings'],dtype=np.float32); n2=np.linalg.norm(m2,axis=1,keepdims=True)
mat2 = m2/np.where(n2==0,1,n2)

def embed_iff(img):
    rgb=cv2.cvtColor(cv2.resize(img,(112,112),interpolation=cv2.INTER_LINEAR),cv2.COLOR_BGR2RGB)
    arr=((rgb.astype(np.float32)-127.5)/127.5).transpose(2,0,1)[np.newaxis]
    raw=sess.run(None,{sess.get_inputs()[0].name:arr})[0][0].astype(np.float32)
    n_=np.linalg.norm(raw); return (raw/n_).tolist() if n_>0 else None

def match2(emb):
    if emb is None: return 'Unknown',0.0
    q=np.array(emb,dtype=np.float32); q/=max(np.linalg.norm(q),1e-8)
    sims=mat2@q; idx=int(np.argmax(sims)); best=float(sims[idx])
    return (d2['names'][idx] if best>=0.65 else 'Unknown'), best

t_transform=0; t_clahe=0; t_embed=0; t_match=0
for person, img in crops:
    t0=time.perf_counter(); c=sim_res(img.copy(),80); t_transform+=time.perf_counter()-t0
    t0=time.perf_counter(); c=apply_clahe(c); t_clahe+=time.perf_counter()-t0
    t0=time.perf_counter(); emb=embed_iff(c); t_embed+=time.perf_counter()-t0
    t0=time.perf_counter(); match2(emb); t_match+=time.perf_counter()-t0

print(f"  transform : {t_transform/n*1000:.1f} ms/img")
print(f"  CLAHE     : {t_clahe/n*1000:.1f} ms/img")
print(f"  embed     : {t_embed/n*1000:.1f} ms/img")
print(f"  match     : {t_match/n*1000:.3f} ms/img")
print(f"  TOTAL     : {(t_transform+t_clahe+t_embed+t_match)/n*1000:.1f} ms/img")
print(f"  → 207 imgs: {(t_transform+t_clahe+t_embed+t_match)/n*207:.1f} sec")
print(f"  → 21 cond : {(t_transform+t_clahe+t_embed+t_match)/n*207*21/60:.1f} min (InsightFace only)")

total_fn512_per_cond = (t_embed/n * 207) # just FN512 embed time for 207 images
# estimate full run
print(f"\n=== RUNTIME ESTIMATE ===")
