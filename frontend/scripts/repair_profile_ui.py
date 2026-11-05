# Universal script to sanitize ProfilePage.jsx colors
with open('frontend/src/pages/ProfilePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Executive Identity Header
content = content.replace(
    'className="relative overflow-hidden rounded-2xl border border-[#23252A] bg-gradient-to-b from-[#141517] via-[#0F1011] to-[#0A0B0C] p-6 sm:p-8 shadow-2xl"',
    'className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm dark:shadow-2xl text-card-foreground"'
)
content = content.replace(
    'border-2 border-[#0F1011] ring-2 ring-emerald-500/30',
    'border-2 border-card ring-2 ring-emerald-500/30'
)
content = content.replace(
    '<h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">',
    '<h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">'
)
content = content.replace(
    '<p className="text-xs sm:text-sm text-zinc-400 font-mono">',
    '<p className="text-xs sm:text-sm text-muted-foreground font-mono">'
)
content = content.replace(
    '<span className="flex items-center gap-1.5 text-zinc-300 font-medium">',
    '<span className="flex items-center gap-1.5 text-foreground font-medium">'
)
content = content.replace(
    'className="mt-6 pt-5 border-t border-[#23252A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090A0C]/60 p-4 rounded-xl border border-zinc-800"',
    'className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/50 p-4 rounded-xl border border-border"'
)
content = content.replace(
    'className="input-linear text-sm py-1.5 px-3 h-9 w-full sm:max-w-md text-white font-medium"',
    'className="input-linear text-sm py-1.5 px-3 h-9 w-full sm:max-w-md text-foreground font-medium bg-card border border-border"'
)

# 2. Stat Cards
content = content.replace(
    'className="card-linear p-5 bg-[#0F1011] border-[#23252A] space-y-2"',
    'className="card-linear p-5 bg-card border border-border text-card-foreground rounded-xl space-y-2 shadow-sm"'
)
content = content.replace(
    '<div className="stat-number text-lg sm:text-2xl text-white">',
    '<div className="stat-number text-lg sm:text-2xl text-foreground font-bold">'
)
content = content.replace(
    '<div className="text-lg font-bold text-white font-mono mt-1">',
    '<div className="text-lg font-bold text-foreground font-mono mt-1">'
)

# 3. Enrolled Personnel Roster Container & Cards
content = content.replace(
    'className="card-linear p-0 bg-[#0F1011] border-[#23252A] overflow-hidden"',
    'className="card-linear p-0 bg-card border border-border rounded-xl overflow-hidden shadow-sm"'
)
content = content.replace(
    'className="p-5 border-b border-[#23252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3"',
    'className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"'
)
content = content.replace(
    '<h3 className="text-sm font-semibold text-white flex items-center gap-2">',
    '<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">'
)
content = content.replace(
    'className="p-3 rounded-xl border border-[#23252A] bg-[#0A0B0D] hover:border-[#34343A] transition-all flex items-center justify-between gap-2.5"',
    'className="p-3 rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 transition-all flex items-center justify-between gap-2.5"'
)
content = content.replace(
    '<div className="text-sm font-semibold text-white truncate">',
    '<div className="text-sm font-semibold text-foreground truncate">'
)
content = content.replace(
    'bg-zinc-900 border border-zinc-800 text-zinc-400',
    'bg-secondary border border-border text-muted-foreground'
)

# 4. Settings, Notifications, & Infrastructure Cards
content = content.replace(
    'className="card-linear p-0 bg-[#0F1011] border-[#23252A]"',
    'className="card-linear p-0 bg-card border border-border rounded-xl shadow-sm"'
)
content = content.replace(
    'className="card-linear p-0 bg-[#0F1011] border-[#23252A] space-y-6"',
    'className="card-linear p-0 bg-card border border-border rounded-xl space-y-6 shadow-sm"'
)
content = content.replace(
    'className="p-5 border-b border-[#23252A]"',
    'className="p-5 border-b border-border"'
)
content = content.replace(
    'className="p-5 border-b border-[#23252A] flex items-center justify-between"',
    'className="p-5 border-b border-border flex items-center justify-between"'
)
content = content.replace(
    '<h3 className="text-sm font-semibold text-white">',
    '<h3 className="text-sm font-semibold text-foreground">'
)
content = content.replace(
    '<h3 className="text-sm font-semibold text-white flex items-center gap-2">',
    '<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">'
)
content = content.replace(
    'border-b border-[#23252A]/50',
    'border-b border-border/60'
)
content = content.replace(
    'border-t border-[#23252A]',
    'border-t border-border'
)
content = content.replace(
    'className="font-mono text-zinc-300 text-[10px] sm:text-[11px] bg-black/40 px-2 py-0.5 rounded border border-[#23252A] break-all max-w-[180px] sm:max-w-none text-right"',
    'className="font-mono text-foreground text-[10px] sm:text-[11px] bg-secondary px-2 py-0.5 rounded border border-border break-all max-w-[180px] sm:max-w-none text-right"'
)
content = content.replace(
    'className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]"',
    'className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border"'
)
content = content.replace(
    'className="p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A]"',
    'className="p-3.5 rounded-xl bg-secondary/40 border border-border"'
)
content = content.replace(
    'className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0A0B0D] border border-[#23252A] text-xs"',
    'className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border text-xs"'
)
content = content.replace(
    'notifPrefs?.[item.key] ? \'bg-[#059669]\' : \'bg-[#23252A]\'',
    'notifPrefs?.[item.key] ? \'bg-emerald-600\' : \'bg-slate-300 dark:bg-slate-700\''
)

with open('frontend/src/pages/ProfilePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("ProfilePage.jsx updated successfully!")
