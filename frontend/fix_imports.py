import os

directory = r"e:\RMS\frontend\src\pages"

# We just want to make the app buildable so the user can test the first 3 pages.
# We will replace Custom Card/Button with standard divs/buttons for now.
for filename in os.listdir(directory):
    if filename.endswith(".jsx") and filename not in ["RegisterPage.jsx", "LoginPage.jsx", "DashboardPage.jsx", "LiveAttendancePage.jsx", "UploadPage.jsx"]:
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace imports
        content = content.replace("import { Card } from '../components/ui/Card';", "")
        content = content.replace("import { Button } from '../components/ui/Button';", "")
        content = content.replace("import { Input } from '../components/ui/Input';", "")
        content = content.replace("import { Badge } from '../components/ui/Badge';", "")
        content = content.replace("import { Reticle } from '../components/ui/Reticle';", "")
        
        # Replace components roughly
        content = content.replace("<Card", '<div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm"')
        content = content.replace("</Card>", "</div>")
        
        content = content.replace("<Button", '<button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium"')
        content = content.replace("</Button>", "</button>")
        
        content = content.replace("<Badge", '<span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-xs"')
        content = content.replace("</Badge>", "</span>")

        content = content.replace("<Reticle", '<div className="w-8 h-8 rounded-full border-2 border-zinc-500 animate-spin"')
        content = content.replace("</Reticle>", "</div>")

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Fixed {filename}")
