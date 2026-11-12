import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

routes_with_params = []
current_decorators = []
for i, line in enumerate(lines):
    line_strip = line.strip()
    if line_strip.startswith('@'):
        current_decorators.append((i+1, line_strip))
    elif line_strip.startswith('def ') and current_decorators:
        func_name = re.findall(r'def\s+([a-zA-Z0-9_]+)', line_strip)[0]
        route_decs = [d for d in current_decorators if '@app.route' in d[1]]
        if route_decs:
            path = re.findall(r'@app\.route\([\'"]([^\'"]+)', route_decs[0][1])
            if path and '<' in path[0]:
                other_decs = [d[1] for d in current_decorators if '@app.route' not in d[1]]
                routes_with_params.append((route_decs[0][0], path[0], func_name, other_decs))
        current_decorators = []
    elif not line_strip.startswith('#') and line_strip != '':
        current_decorators = []

print(f"Total parameterized routes: {len(routes_with_params)}")
for r in routes_with_params:
    print(f"Line {r[0]}: {r[1]} -> def {r[2]} | Decs: {r[3]}")

