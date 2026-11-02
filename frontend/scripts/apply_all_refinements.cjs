const fs = require('fs');
const path = require('path');

// ==========================================
// 1. ProfilePage.jsx
// ==========================================
{
  const file = path.resolve('e:/RMS/frontend/src/pages/ProfilePage.jsx');
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Change editingOrg layout to be mobile responsive
  content = content.replace(
    `<div className="flex items-center gap-2">\n                    <input\n                      type="text"\n                      value={newOrgName}\n                      onChange={(e) => setNewOrgName(e.target.value)}\n                      className="input-linear text-caption py-1 px-2 h-7 w-44 text-ink"`,
    `<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">\n                    <input\n                      type="text"\n                      value={newOrgName}\n                      onChange={(e) => setNewOrgName(e.target.value)}\n                      className="input-linear text-caption py-1 px-2 h-8 w-full sm:w-44 text-ink"`
  );

  // Responsive padding for card-linear inner sections
  content = content.replace(/<div className="py-4 px-6 border-b/g, '<div className="py-3 px-4 sm:py-4 sm:px-6 border-b');
  content = content.replace(/<div className="p-6 space-y-4">/g, '<div className="p-4 sm:p-6 space-y-4">');

  // Notification preferences touch area
  content = content.replace(
    `className={\`relative w-10 h-5 rounded-full transition-colors \${`,
    `className={\`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 \${`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ProfilePage.jsx');
}

// ==========================================
// 2. ModelsPage.jsx
// ==========================================
{
  const file = path.resolve('e:/RMS/frontend/src/pages/ModelsPage.jsx');
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Responsive card padding
  content = content.replace(/<div className="card-linear p-6">/g, '<div className="card-linear p-4 sm:p-6">');
  content = content.replace(/<div className={`card-linear p-6 border/g, '<div className={`card-linear p-4 sm:p-6 border');

  // Edge & Offline Model Exports row responsive flex
  content = content.replace(
    `<div key={idx} className="flex items-center justify-between p-3.5 bg-[#010102]/50 rounded-lg border border-[#23252A] hover:border-[#2D3039] transition-all">`,
    `<div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#010102]/50 rounded-lg border border-[#23252A] hover:border-[#2D3039] transition-all">`
  );

  // Wrap title and code chip nicely
  content = content.replace(
    `<div className="flex items-center gap-2">\n                        <span className="text-caption font-medium text-ink">{item.title}</span>`,
    `<div className="flex flex-wrap items-center gap-1.5 sm:gap-2">\n                        <span className="text-caption font-medium text-ink">{item.title}</span>`
  );

  // Benchmark action buttons full width on small screens
  content = content.replace(
    `className="h-10 px-4 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-caption flex items-center gap-2 transition-all disabled:opacity-50"`,
    `className="h-10 px-4 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-caption flex items-center justify-center gap-2 transition-all disabled:opacity-50 w-full sm:w-auto"`
  );
  content = content.replace(
    `className="button-secondary text-caption flex items-center gap-2 h-10 px-4"`,
    `className="button-secondary text-caption flex items-center justify-center gap-2 h-10 px-4 w-full sm:w-auto"`
  );
  content = content.replace(
    `className="button-primary bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-2 font-medium shadow-lg shadow-[#2563EB]/25"`,
    `className="button-primary bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#2563EB]/25 w-full sm:w-auto"`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ModelsPage.jsx');
}

// ==========================================
// 3. LogsPage.jsx
// ==========================================
{
  const file = path.resolve('e:/RMS/frontend/src/pages/LogsPage.jsx');
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Job History max height on mobile
  content = content.replace(
    `<div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">`,
    `<div className="space-y-2.5 max-h-[260px] sm:max-h-[540px] overflow-y-auto pr-1">`
  );

  // Terminal console toolbar responsive flex
  content = content.replace(
    `<div className="p-2.5 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-wrap items-center justify-between gap-2.5">`,
    `<div className="p-2.5 bg-[#0F1011] border border-[#23252A] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">`
  );

  // Search input min-w-0 on mobile
  content = content.replace(
    `<div className="flex items-center gap-2 flex-1 min-w-[200px]">`,
    `<div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">`
  );

  // Terminal box height on mobile
  content = content.replace(
    `className="bg-black/60 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-ink-subtle h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner"`,
    `className="bg-black/60 rounded-xl p-3.5 sm:p-5 font-mono text-[10px] sm:text-[11px] leading-relaxed text-ink-subtle h-[380px] sm:h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner"`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated LogsPage.jsx');
}

// ==========================================
// 4. ManagePersonPage.jsx
// ==========================================
{
  const file = path.resolve('e:/RMS/frontend/src/pages/ManagePersonPage.jsx');
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Header and Reference images header responsive wrap
  content = content.replace(
    `<div className="flex justify-between items-center mb-4 pt-4 border-t border-[#23252A]">`,
    `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pt-4 border-t border-[#23252A]">`
  );

  // Form inputs min-width responsive
  content = content.replace(
    `<div className="flex-2 min-w-[250px] flex flex-col gap-1.5">`,
    `<div className="flex-1 sm:flex-2 min-w-0 sm:min-w-[200px] flex flex-col gap-1.5">`
  );
  content = content.replace(
    `<div className="flex-1 min-w-[150px] flex flex-col gap-1.5">`,
    `<div className="flex-1 min-w-0 sm:min-w-[140px] flex flex-col gap-1.5">`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ManagePersonPage.jsx');
}

// ==========================================
// 5. TrainingPage.jsx
// ==========================================
{
  const file = path.resolve('e:/RMS/frontend/src/pages/TrainingPage.jsx');
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  // Terminal box height on mobile
  content = content.replace(
    `className="bg-black/60 rounded-xl p-5 font-mono text-[11px] leading-relaxed text-ink-subtle h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner"`,
    `className="bg-black/60 rounded-xl p-3.5 sm:p-5 font-mono text-[10px] sm:text-[11px] leading-relaxed text-ink-subtle h-[380px] sm:h-[500px] overflow-y-auto border border-[#23252A]/60 shadow-inner"`
  );

  // Terminal output card padding
  content = content.replace(
    `<div className="card-linear p-6">`,
    `<div className="card-linear p-4 sm:p-6">`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated TrainingPage.jsx');
}

// ==========================================
// 6. OnboardingWizard.jsx
// ==========================================
{
  const file = path.resolve('e:/RMS/frontend/src/components/OnboardingWizard.jsx');
  let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  content = content.replace(
    `        @media (max-width: 768px) {
          .onb-stepper-dots { display: none; }
          .onb-step-title { display: none; }
          .onb-substep-badge { display: none; }
          .onb-tooltip { max-width: 300px; }
        }`,
    `        @media (max-width: 768px) {
          .onb-stepper-dots { display: none; }
          .onb-step-title { display: none; }
          .onb-substep-badge { display: none; }
          .onb-tooltip {
            max-width: calc(100vw - 24px) !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            padding: 14px !important;
            box-sizing: border-box !important;
          }
          .onb-tooltip-arrow { display: none !important; }
        }`
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated OnboardingWizard.jsx');
}

// ==========================================
// 7. LoginPage.jsx & RegisterPage.jsx
// ==========================================
{
  const loginFile = path.resolve('e:/RMS/frontend/src/pages/LoginPage.jsx');
  let loginContent = fs.readFileSync(loginFile, 'utf8').replace(/\r\n/g, '\n');
  loginContent = loginContent.replace(
    'className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-[#07090E] relative overflow-hidden select-none"',
    'className="flex min-h-screen items-center justify-center p-3 sm:p-6 bg-[#07090E] relative overflow-hidden select-none"'
  );
  loginContent = loginContent.replace(
    'className="bg-[#0D1017] border border-zinc-800 rounded-xl p-7 sm:p-8 shadow-2xl shadow-black/90 relative"',
    'className="bg-[#0D1017] border border-zinc-800 rounded-xl p-5 sm:p-8 shadow-2xl shadow-black/90 relative"'
  );
  fs.writeFileSync(loginFile, loginContent, 'utf8');
  console.log('Updated LoginPage.jsx');

  const regFile = path.resolve('e:/RMS/frontend/src/pages/RegisterPage.jsx');
  let regContent = fs.readFileSync(regFile, 'utf8').replace(/\r\n/g, '\n');
  regContent = regContent.replace(
    'className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-[#07090E] relative overflow-hidden select-none"',
    'className="flex min-h-screen items-center justify-center p-3 sm:p-6 bg-[#07090E] relative overflow-hidden select-none"'
  );
  regContent = regContent.replace(
    'className="bg-[#0D1017] border border-zinc-800 rounded-xl p-7 sm:p-8 shadow-2xl shadow-black/90 relative"',
    'className="bg-[#0D1017] border border-zinc-800 rounded-xl p-5 sm:p-8 shadow-2xl shadow-black/90 relative"'
  );
  fs.writeFileSync(regFile, regContent, 'utf8');
  console.log('Updated RegisterPage.jsx');
}

console.log('All remaining page refinements applied successfully!');

