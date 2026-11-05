# Universal script to sanitize AttendancePage.jsx colors
with open('frontend/src/pages/AttendancePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Stat cards
content = content.replace(
    'p-2.5 sm:p-4 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3',
    'p-2.5 sm:p-4 bg-card border border-border text-card-foreground rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shadow-sm'
)

# 2. Custom Date Input style
content = content.replace("style={{ colorScheme: 'dark' }}", "")

# 3. Status and Sort selects
content = content.replace(
    'className="input-linear h-10 px-2.5 sm:px-3 text-caption text-ink bg-[#0F1011] border border-[#23252A] rounded-lg cursor-pointer focus:outline-none w-full"',
    'className="input-linear h-10 px-2.5 sm:px-3 text-caption text-ink bg-card border border-border rounded-lg cursor-pointer focus:outline-none w-full"'
)

# 4. Quick date buttons
content = content.replace(
    ": 'bg-[#141516] border border-[#23252A] hover:border-[#383A42]'",
    ": 'bg-secondary border border-border hover:border-slate-400 dark:hover:border-slate-600 text-foreground'"
)

# 5. Table container and empty states
content = content.replace(
    'className="card-linear p-0 overflow-hidden bg-[#0F1011] border-[#23252A]"',
    'className="card-linear p-0 overflow-hidden bg-card border border-border rounded-xl shadow-sm"'
)
content = content.replace(
    'className="card-linear p-0 bg-[#0F1011] border-[#23252A]"',
    'className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm"'
)

# 6. Mobile card list hover and divide
content = content.replace('divide-[#23252A]/50', 'divide-border/60')
content = content.replace('hover:bg-[#141516]/60', 'hover:bg-secondary/50')

# 7. Desktop Table Header & Rows
content = content.replace(
    'className="sticky top-0 bg-[#0F1011] border-b border-[#23252A] z-10"',
    'className="sticky top-0 bg-secondary/80 backdrop-blur-sm border-b border-border z-10"'
)
content = content.replace('divide-[#23252A]/50', 'divide-border/60')

# 8. Pagination bar
content = content.replace(
    'className="px-4 sm:px-6 py-3 border-t border-[#23252A] bg-[#0F1011] text-xs text-ink-tertiary flex flex-col sm:flex-row items-center justify-between gap-3"',
    'className="px-4 sm:px-6 py-3 border-t border-border bg-card text-xs text-ink-tertiary flex flex-col sm:flex-row items-center justify-between gap-3"'
)
content = content.replace(
    'className="px-2.5 py-1 rounded bg-[#141516] border border-[#23252A] text-caption text-ink-subtle hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"',
    'className="px-2.5 py-1 rounded bg-secondary border border-border text-caption text-ink-subtle hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"'
)

# 9. Manual Punch modal
content = content.replace(
    'className="bg-[#0F1011] border border-[#23252A] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5"',
    'className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-card-foreground"'
)
content = content.replace(
    'className="flex items-center justify-between pb-3 border-b border-[#23252A]"',
    'className="flex items-center justify-between pb-3 border-b border-border"'
)
content = content.replace(
    'className="flex items-center justify-end gap-3 pt-3 border-t border-[#23252A]"',
    'className="flex items-center justify-end gap-3 pt-3 border-t border-border"'
)
content = content.replace('hover:bg-[#1A1C20]', 'hover:bg-secondary/80')
content = content.replace('bg-[#141516] border border-[#23252A]', 'bg-secondary border border-border text-foreground')
content = content.replace('className="bg-[#141516] text-white"', 'className="bg-card text-foreground"')

with open('frontend/src/pages/AttendancePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("AttendancePage.jsx updated successfully!")

