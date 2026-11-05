with open('frontend/src/components/Navbar.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Sun, Moon to imports
if 'Sun,' not in code:
    code = code.replace(
        "import { Activity, Box, Video, Home, Upload, ClipboardList, Radio, Settings, LogOut, Users, User, Menu, X, Terminal, Shield, Monitor, BarChart3, Play, Camera, Download, Building2 } from 'lucide-react';",
        "import { Activity, Box, Video, Home, Upload, ClipboardList, Radio, Settings, LogOut, Users, User, Menu, X, Terminal, Shield, Monitor, BarChart3, Play, Camera, Download, Building2, Sun, Moon } from 'lucide-react';"
    )

# 2. Add useTheme import
if 'useTheme' not in code:
    code = code.replace(
        "import { usePwa } from '../context/PwaContext';",
        "import { usePwa } from '../context/PwaContext';\nimport { useTheme } from '../context/ThemeContext';"
    )

# 3. Add useTheme in component
if 'const { theme, toggleTheme }' not in code:
    code = code.replace(
        "const { isInstallable, isInstalled, installApp } = usePwa();",
        "const { isInstallable, isInstalled, installApp } = usePwa();\n  const { theme, toggleTheme } = useTheme();"
    )

# 4. Mobile header classes
code = code.replace(
    'bg-[#0F1011]/95 backdrop-blur-md border-b border-[#23252A] fixed top-0 left-0 right-0 z-40',
    'bg-white/95 dark:bg-[#0F1011]/95 border-b border-slate-200 dark:border-[#23252A] fixed top-0 left-0 right-0 z-40'
)

# 5. Mobile drawer backdrop (remove blur)
code = code.replace(
    'className="fixed inset-0 bg-black/60 backdrop-blur-sm"',
    'className="fixed inset-0 bg-black/50"'
)

# 6. Mobile drawer content
code = code.replace(
    'className="relative w-4/5 max-w-xs bg-[#0F1011] h-full border-r border-[#23252A] flex flex-col z-10 p-5 shadow-2xl"',
    'className="relative w-4/5 max-w-xs bg-white dark:bg-[#0F1011] h-full border-r border-slate-200 dark:border-[#23252A] flex flex-col z-10 p-5 shadow-2xl"'
)
code = code.replace(
    'border-b border-[#23252A] mb-4',
    'border-b border-slate-200 dark:border-[#23252A] mb-4'
)

# 7. Add Theme Toggle to mobile drawer footer
mobile_theme_btn = '''                <button
                  type="button"
                  onClick={toggleTheme}
                  className="logout-btn w-full text-left cursor-pointer"
                >
                  {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>'''

if 'onClick={toggleTheme}' not in code:
    code = code.replace(
        '{hasRole(userRole, \'org_admin\') && (\n                  <button \n                    type="button"\n                    onClick={handleStartSetupGuide}',
        mobile_theme_btn + '\n                {hasRole(userRole, \'org_admin\') && (\n                  <button \n                    type="button"\n                    onClick={handleStartSetupGuide}'
    )

# 8. Add Theme Toggle to desktop sidebar footer
desktop_theme_btn = '''          <button
            type="button"
            onClick={toggleTheme}
            className={`logout-btn ${isCollapsed ? 'justify-center' : ''}`}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
            {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>'''

if 'onClick={toggleTheme}' not in code or code.count('onClick={toggleTheme}') < 2:
    code = code.replace(
        '{hasRole(userRole, \'org_admin\') && (\n            <button \n              type="button"\n              onClick={handleStartSetupGuide}',
        desktop_theme_btn + '\n          {hasRole(userRole, \'org_admin\') && (\n            <button \n              type="button"\n              onClick={handleStartSetupGuide}'
    )

# 9. Mobile bottom bar
code = code.replace(
    '<nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0F1011]/95 backdrop-blur-md border-t border-[#23252A] z-40 flex items-center justify-around px-1 shadow-2xl safe-area-bottom">',
    '<nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0F1011]/95 border-t border-slate-200 dark:border-[#23252A] z-40 flex items-center justify-around px-1 shadow-2xl safe-area-bottom">'
)

# 10. Update ui-sidebar style definitions to adapt to theme
old_style_block = '''.ui-sidebar {
              background: rgba(13, 15, 18, 0.85) !important;
              backdrop-filter: blur(20px) saturate(180%) !important;
              -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
              border-right: 1px solid rgba(255, 255, 255, 0.07) !important;
              box-shadow: inset -1px 0 0 0 rgba(255, 255, 255, 0.04) !important;'''

new_style_block = '''.ui-sidebar {
              background: var(--sidebar-bg, #FFFFFF) !important;
              border-right: 1px solid var(--sidebar-border, #E5E7EB) !important;
              box-shadow: inset -1px 0 0 0 rgba(0, 0, 0, 0.04) !important;'''

code = code.replace(old_style_block, new_style_block)

code = code.replace(
    'border-bottom: 1px solid rgba(255, 255, 255, 0.07);',
    'border-bottom: 1px solid var(--sidebar-border, #E5E7EB);'
)
code = code.replace(
    'border-top: 1px solid rgba(255, 255, 255, 0.07);',
    'border-top: 1px solid var(--sidebar-border, #E5E7EB);'
)

with open('frontend/src/components/Navbar.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Navbar.jsx updated successfully!")
