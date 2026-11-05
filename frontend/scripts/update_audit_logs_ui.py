with open('frontend/src/pages/AuditLogsPage.jsx', 'r', encoding='utf-8') as f:
    txt = f.read()

# 1. Update card-linear bar
old_bar = '<div className="card-linear p-3.5 flex flex-wrap items-center gap-3 bg-[#0F1011] border border-[#23252A] rounded-xl shadow-md">'
new_bar = '<div className="card-linear p-3.5 flex flex-wrap items-center gap-3 bg-white dark:bg-[#0F1011] border border-slate-200 dark:border-[#23252A] rounded-xl shadow-sm">'
txt = txt.replace(old_bar, new_bar)

# 2. Search container
old_search = '<div className="flex items-center gap-2 bg-[#141518] border border-[#2B2F38] rounded-xl h-9.5 px-3 flex-1 min-w-[220px] focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">'
new_search = '<div className="flex items-center gap-2 bg-slate-50 dark:bg-[#141518] border border-slate-200 dark:border-[#2B2F38] rounded-xl h-9.5 px-3 flex-1 min-w-[220px] focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">'
txt = txt.replace(old_search, new_search)

# Search text input
old_input = 'className="bg-transparent border-none text-zinc-100 text-xs w-full focus:outline-none placeholder:text-zinc-500"'
new_input = 'className="bg-transparent border-none text-slate-900 dark:text-zinc-100 text-xs w-full focus:outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"'
txt = txt.replace(old_input, new_input)

# 3. Type Filter Tabs container and buttons
old_filter_box = '<div className="flex items-center gap-1 bg-[#141518] border border-[#2B2F38] rounded-xl p-1 shadow-inner">'
new_filter_box = '<div className="flex items-center gap-1 bg-slate-100 dark:bg-[#141518] border border-slate-200 dark:border-[#2B2F38] rounded-xl p-1 shadow-inner">'
txt = txt.replace(old_filter_box, new_filter_box)

old_pill_class = """              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                logType === opt.value 
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' 
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}"""

new_pill_class = """              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                logType === opt.value 
                  ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}"""
txt = txt.replace(old_pill_class, new_pill_class)

# 4. Date inputs
txt = txt.replace(
    'className="h-9 px-3 rounded-lg bg-[#141518] border border-[#2B2F38] text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"\n            style={{ colorScheme: \'dark\' }}',
    'className="h-9 px-3 rounded-lg bg-white dark:bg-[#141518] border border-slate-300 dark:border-[#2B2F38] text-xs text-slate-900 dark:text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"'
)

# 5. Sort button
old_sort = 'className="h-9 px-3 rounded-lg bg-[#141518] border border-[#2B2F38] text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-1.5 cursor-pointer"'
new_sort = 'className="h-9 px-3 rounded-lg bg-white dark:bg-[#141518] border border-slate-200 dark:border-[#2B2F38] text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-zinc-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"'
txt = txt.replace(old_sort, new_sort)

# 6. Refresh button
old_ref = 'className="h-9 w-9 rounded-lg bg-[#141518] border border-[#2B2F38] text-zinc-300 hover:text-white hover:border-zinc-500 flex items-center justify-center transition-colors cursor-pointer"'
new_ref = 'className="h-9 w-9 rounded-lg bg-white dark:bg-[#141518] border border-slate-200 dark:border-[#2B2F38] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-zinc-500 flex items-center justify-center transition-colors cursor-pointer shadow-sm"'
txt = txt.replace(old_ref, new_ref)

with open('frontend/src/pages/AuditLogsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(txt)

print("AuditLogsPage.jsx updated successfully!")

