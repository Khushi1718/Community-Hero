const fs = require('fs');

const path = 'src/app/volunteer-org/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Flatten all cards and inputs
content = content.replace(/rounded-3xl/g, "rounded-sm");
content = content.replace(/rounded-2xl/g, "rounded-sm");
content = content.replace(/rounded-xl/g, "rounded-sm");
content = content.replace(/rounded-lg/g, "rounded-sm");

// 2. Make the layout wide instead of centered
content = content.replace(/max-w-7xl mx-auto/g, "w-full");

// 3. Fix Profile Cover from gradient to solid premium dark green
content = content.replace(/bg-gradient-to-r from-emerald-500 to-teal-500/g, "bg-emerald-900 border-b border-emerald-800");

// 4. Update the avatar container styling (white border to emerald border)
content = content.replace(/border-4 border-white shadow-lg overflow-hidden bg-emerald-600/g, "border-4 border-[#F4F9F5] shadow-sm overflow-hidden bg-emerald-700");

// 5. General background updates
content = content.replace(/bg-slate-50/g, "bg-[#F4F9F5]");
content = content.replace(/bg-surface-50/g, "bg-[#F4F9F5]");

// 6. Check sidebars and borders
content = content.replace(/bg-surface-900/g, "bg-emerald-950");
content = content.replace(/shadow-float/g, "shadow-sm border-r border-emerald-900");
content = content.replace(/border-slate-200/g, "border-emerald-100");
content = content.replace(/bg-slate-100/g, "bg-emerald-50");

fs.writeFileSync(path, content, 'utf8');
console.log("Applied flat layout to volunteer org portal.");
