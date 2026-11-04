import os, glob, pickle, shutil

CLEAN_PICKLE = "/app/encodings.pickle"

with open(CLEAN_PICKLE, "rb") as f:
    clean_data = pickle.load(f)

clean_names = set(clean_data["names"])
print(f"Loaded clean encodings from {CLEAN_PICKLE}: {len(clean_data['encodings'])} vectors for {len(clean_names)} persons: {sorted(list(clean_names))}")

# 1. Update /app/data/encodings.pickle
os.makedirs("/app/data", exist_ok=True)
with open("/app/data/encodings.pickle", "wb") as f:
    pickle.dump(clean_data, f)
print("Updated /app/data/encodings.pickle")

# 2. Update default-org
os.makedirs("/app/data/orgs/default-org", exist_ok=True)
with open("/app/data/orgs/default-org/encodings.pickle", "wb") as f:
    pickle.dump(clean_data, f)
print("Updated /app/data/orgs/default-org/encodings.pickle")

# 3. Clean all org directories and all other pickle files in /app/data/
for p in glob.glob("/app/data/**/*.pickle", recursive=True):
    try:
        data = pickle.load(open(p, "rb"))
        names = set(data.get("names", []))
        # If file contains celebrity names (e.g. Pete_Sampras, Alejandro_Toledo)
        if any(n in names for n in ["Pete_Sampras", "Arnold_Schwarzenegger", "Alejandro_Toledo", "Colin_Powell", "George_W_Bush"]):
            print(f"Purging synthetic celebrities from {p}...")
            # If it's an encodings.pickle, replace with clean_data
            if p.endswith("encodings.pickle"):
                with open(p, "wb") as f:
                    pickle.dump(clean_data, f)
                print(f"Replaced {p} with clean 8-employee vectors.")
            else:
                # Remove obsolete/polluted auxiliary model pickles
                os.remove(p)
                print(f"Removed polluted auxiliary pickle: {p}")
    except Exception as e:
        print(f"Error handling {p}: {e}")

# 4. Remove any fake directories in /app/dataset_cleaned/
dataset_cleaned = "/app/dataset_cleaned"
REAL_FOLDERS = {
    "vatsal_vadgama", "prashant_tarbundiya", "dhruvik_parmar",
    "manan_solanki", "shiven_vamja", "ukani_prince",
    "rakshit_gajnotar", "shivam_petkar", "orgs"
}
for d in os.listdir(dataset_cleaned):
    d_path = os.path.join(dataset_cleaned, d)
    if os.path.isdir(d_path) and d.lower() not in REAL_FOLDERS and not d.startswith("."):
        print(f"Removing unverified dataset folder: {d_path}")
        shutil.rmtree(d_path)

print("\nSync completed successfully!")

