with open('frontend/src/pages/CamerasPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove backdrop-blur-sm from modals
content = content.replace(
    'className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"',
    'className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/50 overflow-y-auto animate-in fade-in duration-150"'
)

# 2. Update Add Camera modal container
content = content.replace(
    '<div className="relative w-full max-w-xl bg-[#0D0F17] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">',
    '<div className="relative w-full max-w-xl bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">'
)

# 3. Update Add Camera modal header
content = content.replace(
    '<h2 className="text-base font-bold text-white flex items-center gap-2">',
    '<h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">'
)
content = content.replace(
    '<p className="text-xs text-slate-400 mt-0.5">',
    '<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">'
)
content = content.replace(
    '<label className="text-xs font-semibold text-slate-300 block mb-1.5">',
    '<label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">'
)
content = content.replace(
    '<label className="text-xs font-medium text-slate-300 block mb-1">',
    '<label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">'
)

# 4. Inputs inside modal
content = content.replace(
    'className="w-full h-10 px-3 bg-[#080A10] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"',
    'className="w-full h-10 px-3 bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"'
)

content = content.replace(
    'className="w-full h-9 px-2.5 bg-[#090C12] border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"',
    'className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"'
)

content = content.replace(
    'className="w-full h-9 px-2.5 bg-[#090C12] border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"',
    'className="w-full h-9 px-2.5 bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"'
)

# 5. RTSP container inside modal
content = content.replace(
    '<div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3.5">',
    '<div className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] space-y-3.5">'
)
content = content.replace(
    '<span className="text-xs font-bold text-slate-200">Select Brand Preset</span>',
    '<span className="text-xs font-bold text-slate-800 dark:text-slate-200">Select Brand Preset</span>'
)
content = content.replace(
    '<div className="p-2.5 rounded-lg bg-[#06080E] border border-white/[0.06] space-y-1">',
    '<div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] space-y-1">'
)

# 6. Action buttons in modal
content = content.replace(
    'className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"',
    'className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"'
)

# 7. Update Live Test Preview modal container
content = content.replace(
    '<div className="relative w-full max-w-2xl bg-[#0D0F17] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">',
    '<div className="relative w-full max-w-2xl bg-white dark:bg-[#0D0F17] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">'
)
content = content.replace(
    '<h3 className="text-base font-bold text-white">{activePreviewCam.name}</h3>',
    '<h3 className="text-base font-bold text-slate-900 dark:text-white">{activePreviewCam.name}</h3>'
)

with open('frontend/src/pages/CamerasPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("CamerasPage.jsx updated successfully!")

