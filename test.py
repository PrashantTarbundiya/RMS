import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter
import time

def load_encodings(encodings_path='encodings.pickle'):
    try:
        data = pickle.loads(open(encodings_path, "rb").read())
        return data
    except Exception as e:
        print(f"❌ Error loading encodings: {e}")
        return None

def calculate_accuracy():
    print("📥 Loading embeddings...")
    start_time = time.time()
    data = load_encodings()
    if data is None:
        return

    all_encodings = np.array(data["encodings"])
    all_names = np.array(data["names"])
    
    total_images = len(all_names)
    print(f"✅ Loaded {total_images} embeddings.")
    
    # 1. Statistics
    name_counts = Counter(all_names)
    single_image_people = {name for name, count in name_counts.items() if count < 2}
    
    print("\n📊 Dataset Statistics:")
    print(f"   Total Identities: {len(name_counts)}")
    print(f"   Identities with >1 image: {len(name_counts) - len(single_image_people)}")
    print(f"   Identities with 1 image: {len(single_image_people)} (Skipped for accuracy test)")
    
    print("\n🚀 Running Vectorized Leave-One-Out Cross Validation...")
    
    # 2. Compute Cosine Similarity Matrix (NxN)
    # This is extremely fast compared to loops
    sim_matrix = cosine_similarity(all_encodings)
    
    # Fill diagonal with -1 so an image doesn't match itself
    np.fill_diagonal(sim_matrix, -1)
    
    # 3. Find index of max similarity for each row
    best_match_indices = np.argmax(sim_matrix, axis=1)
    
    # 4. Get corresponding names
    predicted_names = all_names[best_match_indices]
    
    # 5. Calculate Accuracy
    correct = 0
    total_attempts = 0
    
    # We iterate only to filter out single-image people (though we could vectorize this too)
    for i in range(total_images):
        true_name = all_names[i]
        
        if true_name in single_image_people:
            continue
            
        pred_name = predicted_names[i]
        
        if pred_name == true_name:
            correct += 1
        
        total_attempts += 1

    elapsed = time.time() - start_time
    
    print(f"\n🏆 RESULTS (Calculated in {elapsed:.2f}s)")
    print(f"   Total Tested Attempts: {total_attempts}")
    if total_attempts > 0:
        accuracy = (correct / total_attempts) * 100
        print(f"   ✅ Correct Matches: {correct}")
        print(f"   ❌ Incorrect Matches: {total_attempts - correct}")
        print(f"   🎯 Rank-1 Accuracy: {accuracy:.2f}%")
    else:
        print("   No valid multi-image identities to test.")

if __name__ == "__main__":
    calculate_accuracy()
