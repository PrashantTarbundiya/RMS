import pickle
from collections import Counter

d = pickle.load(open("/app/encodings.pickle", "rb"))
print("Total vectors:", len(d["encodings"]))
print("Breakdown by name:")
for name, count in Counter(d["names"]).most_common():
    print(f"  - {name}: {count} vectors")

