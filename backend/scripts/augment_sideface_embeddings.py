"""
augment_sideface_embeddings.py
Rapidly generates high-density multi-angle sideface anchor vectors for registered team members
and merges them with benchmark weights.
"""
import os
import sys
import time
import pickle
import cv2
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

from model import get_embedding, apply_clahe, warmup_models

TEAM_MEMBERS = [
    'vatsal_vadgama',
    'shivam_petkar',
    'prashant_tarbundiya',
    'Dhruvik_Parmar',
    'Manan_Solanki',
    'Shiven_Vamja',
    'Rakshit_gajnotar',
    'Ukani_Prince'
]

def generate_variants(img, is_profile=True):
    variants = [img]
    h, w = img.shape[:2]
    if is_profile:
        # Symmetrical mirror flip (left acts as right profile, right acts as left profile)
        flipped = cv2.flip(img, 1)
        variants.append(flipped)
        
        # Roll variations to handle camera mount angles (+-4 deg)
        for angle in [-4.0, 4.0]:
            M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
            variants.append(cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REFLECT))
            variants.append(cv2.warpAffine(flipped, M, (w, h), borderMode=cv2.BORDER_REFLECT))
    return variants

def run_team_augmentation():
    print("=" * 70, flush=True)
    print("  RAPID HIGH-DENSITY SIDEFACE ANCHOR GENERATION", flush=True)
    print("=" * 70, flush=True)

    warmup_models()
    dataset_dir = os.path.join(PROJECT_ROOT, 'dataset_cleaned')

    # Discover all registered subjects in dataset_cleaned (combines baseline TEAM_MEMBERS + any new employees)
    target_members = list(TEAM_MEMBERS)
    if os.path.exists(dataset_dir):
        for item in sorted(os.listdir(dataset_dir)):
            item_path = os.path.join(dataset_dir, item)
            if os.path.isdir(item_path) and item not in target_members and item != 'orgs':
                has_subdirs = any(os.path.isdir(os.path.join(item_path, sub)) for sub in ['frontal', 'left', 'right'])
                if has_subdirs:
                    target_members.append(item)

    print(f"  Target enrolled subjects for dense anchors: {len(target_members)} subjects", flush=True)

    team_images = {}
    for member in target_members:
        m_dir = os.path.join(dataset_dir, member)
        if not os.path.exists(m_dir):
            print(f"  [WARNING] Directory missing for {member}")
            continue

        images = []
        # Frontal images
        f_dir = os.path.join(m_dir, 'frontal')
        if os.path.exists(f_dir):
            for f in os.listdir(f_dir):
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                    img = cv2.imread(os.path.join(f_dir, f))
                    if img is not None and img.size > 0:
                        images.append(img)

        # Profile images (left & right) with symmetric mirror + roll jitter
        for angle_dir in ['left', 'right', 'profile']:
            p_path = os.path.join(m_dir, angle_dir)
            if os.path.exists(p_path):
                for f in os.listdir(p_path):
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        img = cv2.imread(os.path.join(p_path, f))
                        if img is not None and img.size > 0:
                            vars = generate_variants(img, is_profile=True)
                            images.extend(vars)

        # Cap at 20 diverse anchors per person
        team_images[member] = images[:20]
        print(f"  Subject '{member}': prepared {len(team_images[member])} multi-angle anchor images", flush=True)

    models = ['Facenet512', 'InsightFace', 'GhostFaceNet']

    for model_name in models:
        print("\n" + "-" * 60, flush=True)
        print(f"Embedding multi-angle vectors for: [{model_name}]...", flush=True)
        print("-" * 60, flush=True)
        t0 = time.time()

        global_path = os.path.join(
            BACKEND_DIR, 'data', 
            f'encodings_{model_name}.pickle' if model_name != 'Facenet512' else 'encodings.pickle'
        )

        with open(global_path, 'rb') as f:
            base_data = pickle.load(f)

        existing_names = list(base_data.get('names', []))
        existing_encs = list(base_data.get('encodings', []))

        # Keep non-team (celebrity) benchmark embeddings intact
        filtered_pairs = [(e, n) for e, n in zip(existing_encs, existing_names) if n not in target_members]
        new_encs = [p[0] for p in filtered_pairs]
        new_names = [p[1] for p in filtered_pairs]
        print(f"  Base benchmark identities: {len(new_encs)} embeddings", flush=True)

        added = 0
        for member, img_list in team_images.items():
            m_count = 0
            for img in img_list:
                try:
                    proc = apply_clahe(img)
                    emb = get_embedding(proc, model_name=model_name)
                    if emb is not None:
                        new_encs.append(emb)
                        new_names.append(member)
                        m_count += 1
                        added += 1
                except Exception:
                    pass
            print(f"    + {member}: {m_count} anchor vectors", flush=True)

        save_dict = {
            'encodings': new_encs,
            'names': new_names,
            'model_used': model_name,
            'version': '3.2-sideface-augmented'
        }

        # Save to global
        with open(global_path, 'wb') as f:
            pickle.dump(save_dict, f)

        if model_name == 'Facenet512':
            root_enc_path = os.path.join(BACKEND_DIR, 'encodings.pickle')
            with open(root_enc_path, 'wb') as f:
                pickle.dump(save_dict, f)

        # Sync to all org directories
        orgs_dir = os.path.join(BACKEND_DIR, 'data', 'orgs')
        if os.path.exists(orgs_dir):
            for org in os.listdir(orgs_dir):
                org_file = os.path.join(orgs_dir, org, f'encodings_{model_name}.pickle' if model_name != 'Facenet512' else 'encodings.pickle')
                if os.path.exists(os.path.dirname(org_file)):
                    with open(org_file, 'wb') as f:
                        pickle.dump(save_dict, f)

        elapsed = time.time() - t0
        print(f"[OK] Saved {len(new_encs)} total vectors (added {added} anchors) -> {global_path} ({elapsed:.1f}s)", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("  ALL SIDEFACE ANCHORS EMBEDDED AND SYNCED SUCCESSFULLY!", flush=True)
    print("=" * 70, flush=True)

if __name__ == '__main__':
    run_team_augmentation()
