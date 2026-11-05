with open('frontend/tailwind.config.js', 'r', encoding='utf-8') as f:
    txt = f.read()

txt = txt.replace('"hsl(var(--', '"var(--').replace('))"', ')"')

with open('frontend/tailwind.config.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(txt)

print('Updated tailwind.config.js!')

