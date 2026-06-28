const fs = require('fs');

const files = [
  'src/app/admin/page.tsx',
  'src/app/employee/page.tsx'
];

for (const path of files) {
  if (!fs.existsSync(path)) continue;
  
  let content = fs.readFileSync(path, 'utf8');

  // 1. Flatten all cards and inputs
  content = content.replace(/rounded-3xl/g, "rounded-sm");
  content = content.replace(/rounded-2xl/g, "rounded-sm");
  content = content.replace(/rounded-xl/g, "rounded-sm");
  content = content.replace(/rounded-lg/g, "rounded-sm");

  // 2. Change main background to premium light green
  content = content.replace(/bg-slate-50/g, "bg-[#F4F9F5]");
  content = content.replace(/bg-surface-50/g, "bg-[#F4F9F5]");
  
  // 3. Change sidebars to deep emerald green
  content = content.replace(/bg-surface-900/g, "bg-emerald-950");
  content = content.replace(/shadow-float/g, "shadow-sm border-r border-emerald-900");

  // 4. Change borders to light emerald
  content = content.replace(/border-slate-200/g, "border-emerald-100");
  content = content.replace(/border-surface-200/g, "border-emerald-100");
  content = content.replace(/border-surface-100/g, "border-emerald-100");
  
  // 5. Change primary accents to emerald
  content = content.replace(/bg-surface-100/g, "bg-emerald-50");
  content = content.replace(/bg-surface-800/g, "bg-emerald-900");
  content = content.replace(/hover:bg-surface-800/g, "hover:bg-emerald-900");
  content = content.replace(/hover:bg-surface-100/g, "hover:bg-emerald-100");
  
  // 6. Highlight headers in sidebar
  content = content.replace(
    />Admin Portal</g,
    '><span className="text-emerald-400">STATE</span> ADMIN PORTAL<'
  );
  content = content.replace(
    />Field Portal</g,
    '><span className="text-emerald-400">FIELD</span> PORTAL<'
  );

  fs.writeFileSync(path, content, 'utf8');
}

console.log("Upgrade complete.");
