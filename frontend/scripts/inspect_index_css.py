with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Line 1 to 20:")
for i in range(min(20, len(lines))):
    print(f"{i+1}: {lines[i].rstrip()}")

# Find @layer base end
for i, l in enumerate(lines):
    if '@layer base' in l:
        print(f"@layer base at line {i+1}")
    if i > 250 and l.strip() == '}':
        print(f"Possible block close at line {i+1}")
        break
