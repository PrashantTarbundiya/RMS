with open('frontend/src/pages/AuditLogsPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'className="rounded-xl overflow-hidden border border-[#23252A] bg-[#0F1011]"',
    'className="rounded-xl overflow-hidden border border-border bg-card shadow-sm"'
)
text = text.replace('divide-y divide-[#23252A]', 'divide-y divide-border/60')
text = text.replace('hover:bg-[#161719]', 'hover:bg-secondary/50')
text = text.replace('border-t border-[#23252A]/50', 'border-t border-border/60')
text = text.replace('<tr className="border-b border-[#23252A]">', '<tr className="border-b border-border bg-secondary/60">')
text = text.replace('className="border-b border-[#23252A] table-row-hover"', 'className="border-b border-border/60 table-row-hover"')
text = text.replace(
    ": 'bg-[#0F1011] text-ink-subtle border border-[#23252A] hover:border-[#34343A]'",
    ": 'bg-secondary text-ink-subtle border border-border hover:border-slate-400 dark:hover:border-slate-600'"
)

with open('frontend/src/pages/AuditLogsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("AuditLogsPage.jsx updated successfully!")
