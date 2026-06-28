const fs = require('fs');

const adminPath = 'src/app/admin/page.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// 1. Remove unwanted sections from navItems
adminContent = adminContent.replace(/{\s*id:\s*"area_adoptions"[^}]*},\s*/g, '');
adminContent = adminContent.replace(/{\s*id:\s*"analytics"[^}]*},\s*/g, '');
adminContent = adminContent.replace(/{\s*id:\s*"heatmap"[^}]*},\s*/g, '');
adminContent = adminContent.replace(/{\s*id:\s*"leaderboard"[^}]*},\s*/g, '');
adminContent = adminContent.replace(/{\s*id:\s*"audit_logs"[^}]*},\s*/g, '');
adminContent = adminContent.replace(/{\s*id:\s*"health"[^}]*},\s*/g, '');

// Also remove their Top Bar title logic if present (they are not present in Top Bar, but just in case)
// We leave the actual tab contents (activeTab === 'heatmap' etc) in the file, 
// they won't be accessible without the nav button anyway, saving us from breaking JSX.
// BUT the user said "remove unwanted sections". Since they're inaccessible, they won't render. 

// 2. Fix the shifted UI by removing max-w-7xl mx-auto
adminContent = adminContent.replace(/max-w-7xl mx-auto/g, 'w-full');
// Do the same for employee page
const employeePath = 'src/app/employee/page.tsx';
let employeeContent = fs.readFileSync(employeePath, 'utf8');
employeeContent = employeeContent.replace(/max-w-7xl mx-auto/g, 'w-full');

// 3. Cards in dashboard rectangle (rounded-sm -> rounded-none for cards)
adminContent = adminContent.replace(/rounded-sm/g, 'rounded-none');
employeeContent = employeeContent.replace(/rounded-sm/g, 'rounded-none');

// 4. Sidebar dark green
adminContent = adminContent.replace(/bg-emerald-950/g, 'bg-emerald-900');
employeeContent = employeeContent.replace(/bg-emerald-950/g, 'bg-emerald-900');
// Also border-emerald-900 to border-emerald-800
adminContent = adminContent.replace(/border-emerald-900/g, 'border-emerald-800');
employeeContent = employeeContent.replace(/border-emerald-900/g, 'border-emerald-800');

fs.writeFileSync(adminPath, adminContent, 'utf8');
fs.writeFileSync(employeePath, employeeContent, 'utf8');

console.log("Applied alignment and styling updates.");
