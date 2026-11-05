# Universal CSS Overhaul Script
import re

# 1. Update frontend/src/index.css
with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace the entire broken @layer base block from line 13 to line 230
pattern = r'@layer base\s*\{\s*:root\s*\{.*?--font-mono:[^;]+;\s*\}\s*\}'
# If that pattern doesn't match easily, let's find the exact indices
start_idx = css.find('@layer base {')
if start_idx != -1:
    second_layer_idx = css.find('@layer base {', start_idx + 12)
    if second_layer_idx != -1:
        # We replace from start_idx up to second_layer_idx
        clean_theme_block = """@layer base {
  :root, .light {
    --background: #F8FAFC;
    --foreground: #0F172A;
    --card: #FFFFFF;
    --card-foreground: #0F172A;
    --popover: #FFFFFF;
    --popover-foreground: #0F172A;
    --primary: #059669;
    --primary-foreground: #FFFFFF;
    --secondary: #F1F5F9;
    --secondary-foreground: #0F172A;
    --muted: #F1F5F9;
    --muted-foreground: #64748B;
    --accent: #F1F5F9;
    --accent-foreground: #0F172A;
    --destructive: #EF4444;
    --destructive-foreground: #FFFFFF;
    --border: #E2E8F0;
    --border-strong: #CBD5E1;
    --input: #E2E8F0;
    --ring: #10B981;
    --radius: 8px;

    --canvas: #F8FAFC;
    --surface: #FFFFFF;
    --surface-elevated: #FFFFFF;
    --surface-glass: rgba(255, 255, 255, 0.95);
    --surface-glass-card: #FFFFFF;
    --surface-1: #FFFFFF;
    --surface-2: #F1F5F9;
    --surface-3: #E2E8F0;
    --surface-4: #CBD5E1;

    --sidebar-bg: #FFFFFF;
    --sidebar-border: #E2E8F0;

    --glass-bg: #FFFFFF;
    --glass-bg-subtle: #F8FAFC;
    --glass-bg-elevated: #FFFFFF;
    --glass-border: #E2E8F0;
    --glass-border-subtle: #F1F5F9;
    --glass-border-specular: inset 0 1px 0 0 rgba(255, 255, 255, 1);
    --glass-border-emerald: 1px solid rgba(16, 185, 129, 0.35);
    --glass-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
    --glass-shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
    --glass-blur: none;
    --glass-blur-lg: none;

    --hairline: #E2E8F0;
    --hairline-strong: #CBD5E1;
    --hairline-tertiary: #94A3B8;

    --accent-primary: #059669;
    --brand-secure: #10B981;

    --text-primary: #0F172A;
    --text-secondary: #334155;
    --text-muted: #64748B;
    --ink: #0F172A;
    --ink-muted: #334155;
    --ink-subtle: #64748B;
    --ink-tertiary: #94A3B8;

    --alert-crimson: #EF4444;
    --warn-amber: #D97706;

    --space-xxs: 3px;
    --space-xs: 6px;
    --space-sm: 10px;
    --space-md: 14px;
    --space-lg: 16px;
    --space-xl: 20px;
    --space-xxl: 28px;
    --space-section: 48px;

    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-xxl: 24px;
    --radius-pill: 8px;

    --font-mono: 'JetBrains Mono', monospace;
  }

  .dark {
    --background: #090D16;
    --foreground: #F8FAFC;
    --card: #111827;
    --card-foreground: #F8FAFC;
    --popover: #111827;
    --popover-foreground: #F8FAFC;
    --primary: #10B981;
    --primary-foreground: #090D16;
    --secondary: #1F2937;
    --secondary-foreground: #F8FAFC;
    --muted: #1F2937;
    --muted-foreground: #94A3B8;
    --accent: #1F2937;
    --accent-foreground: #F8FAFC;
    --destructive: #EF4444;
    --destructive-foreground: #FFFFFF;
    --border: #1E293B;
    --border-strong: rgba(255, 255, 255, 0.14);
    --input: #1E293B;
    --ring: #10B981;

    --canvas: #090D16;
    --surface: #111827;
    --surface-elevated: #1F2937;
    --surface-glass: rgba(17, 24, 39, 0.85);
    --surface-glass-card: rgba(17, 24, 39, 0.95);
    --surface-1: #111827;
    --surface-2: #1F2937;
    --surface-3: #374151;
    --surface-4: #4B5563;

    --sidebar-bg: #0B0F19;
    --sidebar-border: #1E293B;

    --glass-bg: #111827;
    --glass-bg-subtle: #0B0F19;
    --glass-bg-elevated: #1F2937;
    --glass-border: #1E293B;
    --glass-border-subtle: rgba(255, 255, 255, 0.05);
    --glass-border-specular: inset 0 1px 0 0 rgba(255, 255, 255, 0.12);
    --glass-border-emerald: 1px solid rgba(16, 185, 129, 0.25);
    --glass-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.4);
    --glass-shadow-lg: 0 20px 50px 0 rgba(0, 0, 0, 0.65);
    --glass-blur: none;
    --glass-blur-lg: none;

    --hairline: #1E293B;
    --hairline-strong: rgba(255, 255, 255, 0.14);
    --hairline-tertiary: rgba(255, 255, 255, 0.18);

    --accent-primary: #10B981;
    --brand-secure: #34D399;

    --text-primary: #F8FAFC;
    --text-secondary: #CBD5E1;
    --text-muted: #94A3B8;
    --ink: #F8FAFC;
    --ink-muted: #CBD5E1;
    --ink-subtle: #94A3B8;
    --ink-tertiary: #64748B;

    --alert-crimson: #EF4444;
    --warn-amber: #F5B942;
  }
}

"""
        css = css[:start_idx] + clean_theme_block + css[second_layer_idx:]
        print("Successfully replaced first @layer base block in index.css")

# Also ensure universal overrides at the bottom are comprehensive
overrides_marker = "/* ── Cal.com & Pop.site Light Mode Universal Overrides ── */"
comprehensive_overrides = """/* ── Cal.com & Pop.site Light Mode Universal Overrides ── */
.light .segmented-nav {
  background: #F1F5F9 !important;
  border-color: #E2E8F0 !important;
}

.light .segment-item {
  color: #475569 !important;
}

.light .segment-item:hover {
  color: #0F172A !important;
  background: rgba(0, 0, 0, 0.04) !important;
}

.light .segment-item.active {
  background: #FFFFFF !important;
  border-color: #E2E8F0 !important;
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
.light .bg-\\[\\#0A0A0C\\],
.light .bg-\\[\\#06080E\\],
.light .bg-\\[\\#16181D\\],
.light .bg-\\[\\#0A0B0D\\],
.light .bg-\\[\\#0A0A0A\\] {
  background-color: #FFFFFF !important;
  color: #0F172A !important;
  border-color: #E2E8F0 !important;
}

.light .bg-\\[\\#010102\\] {
  background-color: #F8FAFC !important;
  color: #0F172A !important;
}

.light .border-\\[\\#23252A\\],
.light .border-\\[\\#2B2F38\\],
.light .border-\\[\\#30333C\\],
.light .border-\\[\\#202227\\],
.light .border-\\[\\#282A30\\],
.light .border-\\[\\#3E434F\\],
.light .border-\\[\\#343842\\],
.light .border-\\[\\#383A42\\] {
  border-color: #E2E8F0 !important;
}

.light .border-white\\/\\[0\\.06\\],
.light .border-white\\/\\[0\\.08\\],
.light .border-white\\/10 {
  border-color: #E2E8F0 !important;
}

.light .text-white:not(.button-primary):not(.button-primary *):not(.bg-emerald-600 *):not(.bg-emerald-500 *) {
  color: #0F172A !important;
}

.light .text-slate-100,
.light .text-slate-200,
.light .text-zinc-100,
.light .text-zinc-200 {
  color: #0F172A !important;
}

.light .text-slate-300,
.light .text-slate-400,
.light .text-zinc-300,
.light .text-zinc-400 {
  color: #475569 !important;
}

/* In Dark mode: prevent stray bg-white from creating glaring white boxes */
.dark .bg-white:not(.button-primary):not(.button-primary *) {
  background-color: #111827 !important;
  color: #F8FAFC !important;
  border-color: #1E293B !important;
}

.dark .text-slate-900,
.dark .text-zinc-900,
.dark .text-black {
  color: #F8FAFC !important;
}

.light input[type="time"],
.light input[type="date"] {
  color-scheme: light !important;
  background-color: #FFFFFF !important;
  border-color: #CBD5E1 !important;
  color: #0F172A !important;
}

.dark input[type="time"],
.dark input[type="date"] {
  color-scheme: dark !important;
}
"""

if overrides_marker in css:
    marker_pos = css.find(overrides_marker)
    css = css[:marker_pos] + comprehensive_overrides
else:
    css += "\n" + comprehensive_overrides

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("index.css rewritten successfully!")
