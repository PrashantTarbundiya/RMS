# Systematic replacement script for console pages
import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    for old, new in replacements:
        text = text.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Updated {path}")

# DashboardPage.jsx
update_file('frontend/src/pages/DashboardPage.jsx', [
    ('bg-[#0F1011] border border-[#23252A]', 'bg-card border border-border text-card-foreground shadow-sm'),
    ('hover:border-[#383A42]', 'hover:border-slate-400 dark:hover:border-slate-600'),
])

# CamerasPage.jsx
update_file('frontend/src/pages/CamerasPage.jsx', [
    ('bg-[#0F1011] border border-[#23252A]', 'bg-card border border-border text-foreground'),
    ('bg-[#0B0D14]', 'bg-card shadow-sm'),
    ('border-white/[0.08]', 'border-border'),
    ('divide-white/[0.06]', 'divide-border'),
    ('hover:bg-white/[0.02]', 'hover:bg-secondary/50'),
    ('text-sm font-semibold text-white">{cam.name}', 'text-sm font-semibold text-foreground">{cam.name}'),
])

# DepartmentsPage.jsx
update_file('frontend/src/pages/DepartmentsPage.jsx', [
    ('bg-[#0F1011] border-[#23252A]', 'bg-card border-border shadow-sm'),
    ('bg-[#141516] border border-[#23252A]', 'bg-secondary border border-border text-foreground'),
])

print("All target console pages repaired!")
