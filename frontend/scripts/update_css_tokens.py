import re

with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Update glass tokens in :root
old_glass_marker = "/* ── Liquid Glassmorphism Tokens (macOS Sonoma / Sequoia Spec) ── */"
new_glass_root = """/* ── Light Mode Glass & Surface Tokens (Default) ── */
    --glass-bg: #FFFFFF;
    --glass-bg-subtle: #F9FAFB;
    --glass-bg-elevated: #FFFFFF;
    --glass-border: #E5E7EB;
    --glass-border-subtle: #F3F4F6;
    --glass-border-specular: inset 0 1px 0 0 rgba(255, 255, 255, 1);
    --glass-border-emerald: 1px solid rgba(16, 185, 129, 0.35);
    --glass-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04);
    --glass-shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    --glass-blur: none;
    --glass-blur-lg: none;
    --sidebar-bg: #FFFFFF;
    --sidebar-border: #E5E7EB;"""

if old_glass_marker in css:
    css = re.sub(
        r'/\* ── Liquid Glassmorphism Tokens.*?--glass-blur-lg: blur\(24px\) saturate\(180%\);',
        new_glass_root,
        css,
        flags=re.DOTALL
    )
    print("Replaced :root glass tokens")

# 2. Add dark glass tokens to .dark block
dark_glass_tokens = """    /* ── Dark Mode Glass & Surface Tokens ── */
    --glass-bg: rgba(15, 17, 21, 0.75);
    --glass-bg-subtle: rgba(20, 24, 29, 0.50);
    --glass-bg-elevated: rgba(24, 28, 35, 0.78);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-border-subtle: rgba(255, 255, 255, 0.05);
    --glass-border-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
    --glass-border-emerald: 1px solid rgba(16, 185, 129, 0.25);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.42);
    --glass-shadow-lg: 0 20px 50px 0 rgba(0, 0, 0, 0.55);
    --glass-blur: blur(16px) saturate(180%);
    --glass-blur-lg: blur(24px) saturate(180%);
    --sidebar-bg: #0D0F12;
    --sidebar-border: rgba(255, 255, 255, 0.08);"""

if '.dark {' in css and '--sidebar-bg' not in css:
    css = css.replace('.dark {', '.dark {\n' + dark_glass_tokens)
    print("Added dark glass tokens to .dark")

# 3. Fix button-secondary hover text color
css = re.sub(
    r'(\.button-secondary:hover:not\(:disabled\)\s*\{[^}]*color:\s*)#FFFFFF;',
    r'\1var(--text-primary);',
    css
)

# 4. Fix html color-scheme
css = re.sub(
    r'html\s*\{\s*color-scheme:\s*dark;\s*scrollbar-gutter:\s*stable;\s*\}',
    'html, html.light {\n    color-scheme: light;\n    scrollbar-gutter: stable;\n  }\n  html.dark {\n    color-scheme: dark;\n  }',
    css
)

# 5. Universal Light Mode Overrides
light_overrides = """
/* ── Cal.com & Pop.site Light Mode Universal Overrides ── */
.light .segmented-nav {
  background: #F3F4F6 !important;
  border-color: #E5E7EB !important;
}

.light .segment-item {
  color: #4B5563 !important;
}

.light .segment-item:hover {
  color: #111827 !important;
  background: rgba(0, 0, 0, 0.05) !important;
}

.light .segment-item.active {
  background: #FFFFFF !important;
  border-color: #E5E7EB !important;
  color: #059669 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
}

/* Light mode overrides for arbitrary dark Tailwind containers */
.light .bg-\\[\\#0F1011\\],
.light .bg-\\[\\#141518\\],
.light .bg-\\[\\#141516\\],
.light .bg-\\[\\#0D0F17\\],
.light .bg-\\[\\#0C0F17\\],
.light .bg-\\[\\#0A0D14\\],
.light .bg-\\[\\#101216\\],
.light .bg-\\[\\#181A1F\\],
.light .bg-\\[\\#07090F\\],
.light .bg-\\[\\#080A10\\],
.light .bg-\\[\\#0A0A0C\\] {
  background-color: #FFFFFF !important;
}

.light .bg-\\[\\#010102\\] {
  background-color: #F3F4F6 !important;
}

.light .border-\\[\\#23252A\\],
.light .border-\\[\\#2B2F38\\],
.light .border-\\[\\#30333C\\],
.light .border-\\[\\#202227\\],
.light .border-\\[\\#282A30\\],
.light .border-\\[\\#3E434F\\] {
  border-color: #E5E7EB !important;
}

.light .border-white\\/\\[0\\.06\\],
.light .border-white\\/\\[0\\.08\\],
.light .border-white\\/10 {
  border-color: #E5E7EB !important;
}

.light input[type="time"],
.light input[type="date"] {
  color-scheme: light !important;
  background-color: #FFFFFF !important;
  border-color: #D1D5DB !important;
  color: #111827 !important;
}

.dark input[type="time"],
.dark input[type="date"] {
  color-scheme: dark !important;
}
"""

if '/* ── Cal.com & Pop.site Light Mode Universal Overrides ── */' not in css:
    css += '\n' + light_overrides
    print("Appended light mode universal overrides")

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("index.css updated successfully!")
