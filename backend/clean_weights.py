import os
import re
import pickle
import glob

BENCHMARK_EXCLUDED_FRIEND_PATTERNS = []
 
def is_friend(name):
    return False

def clean_pickle_file(file_path):
    if not os.path.isfile(file_path):
        return
    try:
        with open(file_path, 'rb') as f:
            data = pickle.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return

    if not isinstance(data, dict):
        return

    # Typical structure: {'names': [...], 'encodings': [...]} or {name: [encodings]}
    modified = False
    if 'names' in data and 'encodings' in data:
        names = data['names']
        encs = data['encodings']
        keep_names = []
        keep_encs = []
        removed = 0
        for n, e in zip(names, encs):
            if is_friend(n):
                removed += 1
            else:
                keep_names.append(n)
                keep_encs.append(e)
        if removed > 0:
            data['names'] = keep_names
            data['encodings'] = keep_encs
            modified = True
            print(f"[{file_path}] Removed {removed} friend encodings. Remaining: {len(keep_names)} (unique identities: {len(set(keep_names))})")
    else:
        # Dictionary keyed by name
        keys_to_remove = [k for k in data.keys() if is_friend(k)]
        if keys_to_remove:
            for k in keys_to_remove:
                del data[k]
            modified = True
            print(f"[{file_path}] Removed keys: {keys_to_remove}. Remaining identities: {len(data)}")

    if modified:
        with open(file_path, 'wb') as f:
            pickle.dump(data, f)
        print(f"Saved cleaned pickle: {file_path}")

def run_clean():
    search_dirs = [
        'data',
        'backend/data',
        '/app/data'
    ]
    for d in search_dirs:
        if os.path.exists(d):
            print(f"Scanning directory: {d}")
            pickle_files = glob.glob(os.path.join(d, '**', '*.pickle'), recursive=True)
            for pf in pickle_files:
                clean_pickle_file(pf)

if __name__ == '__main__':
    run_clean()
