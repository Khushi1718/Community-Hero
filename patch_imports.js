const fs = require('fs');
const path = 'src/app/community/page.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  'AlertTriangle, CheckCircle2, Clock, Send, X, BarChart2, TrendingUp, Building2, Eye,',
  'AlertTriangle, CheckCircle2, Clock, Send, X, BarChart2, TrendingUp, Building2, Eye, Leaf,'
);
fs.writeFileSync(path, content);
