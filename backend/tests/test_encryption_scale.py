import os
import sys
import pickle
import time
import random
import numpy as np
from scipy.spatial.distance import cosine

from security_hardening import (
    generate_org_encryption_key,
    encrypt_encodings_file,
    decrypt_encodings_file,
    is_file_encrypted
)

def run_test():
    original_path = 'encodings.pickle'
    encrypted_path = 'encodings_test.encrypted'
    
    if not os.path.exists(original_path):
        print(f"File not found: {original_path}")
        return
        
    print("1. Loading original encodings.pickle...")
    with open(original_path, 'rb') as f:
        data = pickle.load(f)
        
    original_names = data.get('names', [])
    original_encodings = data.get('encodings', [])
    
    print(f"Original entries: {len(original_names)}")
    
    key = generate_org_encryption_key()
    
    print("2. Encrypting file to disk...")
    start = time.time()
    success, stats, err = encrypt_encodings_file(original_path, encrypted_path, key)
    if not success:
        print(f"Encryption failed: {err}")
        return
    print(f"Encryption took {time.time()-start:.2f}s. Overhead: {stats['overhead_bytes']} bytes")
    
    print("3. Checking is_file_encrypted...")
    if not is_file_encrypted(encrypted_path):
        print("ERROR: is_file_encrypted returned False!")
        return
        
    print("4. Decrypting file from disk...")
    start = time.time()
    success, decrypted_data, err = decrypt_encodings_file(encrypted_path, key)
    if not success:
        print(f"Decryption failed: {err}")
        return
    print(f"Decryption took {time.time()-start:.2f}s")
    
    decrypted_names = decrypted_data.get('names', [])
    decrypted_encodings = decrypted_data.get('encodings', [])
    
    print(f"Decrypted entries: {len(decrypted_names)}")
    
    if len(original_names) != len(decrypted_names):
        print("ERROR: Length mismatch!")
        return
        
    print("5. Verifying KNN matching correctness...")
    # Pick 50 random indices to test match
    indices = random.sample(range(len(original_names)), 50)
    for idx in indices:
        orig_emb = original_encodings[idx]
        dec_emb = decrypted_encodings[idx]
        
        # Test cosine similarity between original and decrypted (should be 0.0 distance)
        dist = cosine(orig_emb, dec_emb)
        if dist > 1e-6:
            print(f"ERROR: Decrypted embedding for {original_names[idx]} at index {idx} has distance {dist} from original!")
            return
            
    print("SUCCESS: Encrypted embeddings match original exactly and are functionally correct.")
    
    if os.path.exists(encrypted_path):
        os.remove(encrypted_path)

if __name__ == '__main__':
    run_test()
