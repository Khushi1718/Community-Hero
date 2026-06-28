const fs = require('fs');

const path = 'src/app/volunteer-org/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useMemo to react imports
content = content.replace(/import { useEffect, useState, useCallback } from "react";/, 'import { useEffect, useState, useCallback, useMemo } from "react";');

// 2. Insert computedTrustScore calculation
const hookInjectionPoint = "const [editSaving, setEditSaving] = useState(false);";
const trustScoreCalculation = `
  // Calculate dynamic trust score
  const computedTrustScore = useMemo(() => {
    if (!org) return 0;
    let score = 50; // Base score
    if (org.verifiedBy) score += 20; // +20 if verified
    
    // +5 for each completed drive
    const completedDrives = myDrives.filter(d => d.status === 'COMPLETED').length;
    score += completedDrives * 5;
    
    // -10 for each cancelled drive
    const cancelledDrives = myDrives.filter(d => d.status === 'CANCELLED').length;
    score -= cancelledDrives * 10;
    
    // -15 for each overdue drive
    const overdueDrives = myDrives.filter(d => d.status === 'OVERDUE').length;
    score -= overdueDrives * 15;
    
    // +2 for each active member
    const activeMembersCount = org.members ? org.members.filter((m: any) => m.status === 'member').length : (org.activeMembers || 0);
    score += activeMembersCount * 2;
    
    return Math.max(0, Math.min(100, score)); // clamp between 0 and 100
  }, [org, myDrives]);
`;
content = content.replace(hookInjectionPoint, hookInjectionPoint + '\n' + trustScoreCalculation);

// 3. Replace usages
content = content.replace(/\{org\?\.trustScore \?\? 50\}\/100/g, "{computedTrustScore}/100");
content = content.replace(/width: `\$\{org\?\.trustScore \?\? 50\}%`/g, "width: `${computedTrustScore}%`");
content = content.replace(/<p className="font-black text-emerald-700 text-xl tracking-tight">\{org\?\.trustScore \|\| 0\}<\/p>/g, '<p className="font-black text-emerald-700 text-xl tracking-tight">{computedTrustScore}</p>');

fs.writeFileSync(path, content, 'utf8');
console.log("Trust Score logic implemented.");
