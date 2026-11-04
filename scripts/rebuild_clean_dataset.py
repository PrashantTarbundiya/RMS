import os
import pickle
import numpy as np
from collections import Counter

REAL_PERSONS = {
    'vatsal_vadgama',
    'prashant_tarbundiya',
    'dhruvik_parmar',
    'manan_solanki',
    'shiven_vamja',
    'ukani_prince',
    'rakshit_gajnotar',
    'shivam_petkar'
}

enc_path = 'backend/encodings.pickle'
if os.path.exists(enc_path):
    with open(enc_path, 'rb') as f:
        data = pickle.load(f)
    names = data.get('names', [])
    encs = data.get('encodings', [])
    print(f"Original encodings count: {len(encs)}")
    print("Original people count:", len(set(names)))

    # Filter out fake celebrity datasets
    clean_names = []
    clean_encs = []
    for n, e in zip(names, encs):
        norm = n.strip().lower().replace(' ', '_')
        if norm in REAL_PERSONS:
            clean_names.append(n)
            clean_encs.append(e)

    print(f"Filtered clean encodings count: {len(clean_encs)}")
    print("Clean people:", Counter(clean_names))

    # Backup original
    with open('backend/encodings_backup_all.pickle', 'wb') as f:
        pickle.dump(data, f)

    # Save cleaned
    clean_data = {
        'names': clean_names,
        'encodings': clean_encs
    }
    with open(enc_path, 'wb') as f:
        pickle.dump(clean_data, f)
    print("SUCCESS: Saved clean encodings.pickle with ONLY real employees!")

