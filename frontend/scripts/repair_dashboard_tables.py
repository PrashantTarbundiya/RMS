with open('frontend/src/pages/DashboardPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('border-b border-[#23252A] gap-3 bg-[#0F1011]', 'border-b border-border gap-3 bg-secondary/30')
text = text.replace('border-b border-[#23252A] bg-[#141516]/50', 'border-b border-border bg-secondary/60')
text = text.replace('border-b border-[#23252A] bg-[#0F1011]', 'border-b border-border bg-secondary/30')
text = text.replace('border-b border-[#23252A]/50 hover:bg-[#141516]/30', 'border-b border-border/60 hover:bg-secondary/40')
text = text.replace('className="card-linear p-0 overflow-hidden flex flex-col"', 'className="card-linear p-0 overflow-hidden flex flex-col bg-card border border-border rounded-xl shadow-sm"')

with open('frontend/src/pages/DashboardPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("DashboardPage.jsx updated successfully!")

