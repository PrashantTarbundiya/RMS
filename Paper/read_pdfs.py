import pypdf
import os

pdf_files = [f for f in os.listdir('.') if f.endswith('.pdf')]

for pdf_file in pdf_files:
    print(f"\n" + "="*50)
    print(f"📄 Analyzing: {pdf_file}")
    print("="*50)
    try:
        reader = pypdf.PdfReader(pdf_file)
        # Extract text from all pages
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
        
        with open("pdf_summary.txt", "a", encoding="utf-8") as f:
            f.write(f"\n{'='*50}\nPAPER: {pdf_file}\n{'='*50}\n{text[:5000]}\n")
            
    except Exception as e:
        with open("pdf_summary.txt", "a", encoding="utf-8") as f:
            f.write(f"❌ Error reading {pdf_file}: {e}\n")
