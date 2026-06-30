const fs = require('fs');

const files = [
  'src/app/volunteer-org/dashboard/page.tsx',
  'src/app/community/org/[id]/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('import { ModalPortal }')) {
    content = content.replace(/(import .* from "lucide-react";)/, '$1\nimport { ModalPortal } from "@/components/ModalPortal";');
  }

  // A very simple regex to find all modals that look like:
  // {condition && (
  //   <div className="fixed inset-0 ...">
  //     <div className="absolute ..."></div>
  //     <div className="...">
  //       ...
  //       </div>
  //     </div>
  //   </div>
  // )}
  
  // Since nested div matching is hard with regex, we can just find the closing `)}` that aligns with `{condition && (`
  // But wait! It's much easier to just do string replacements. Let's just find `fixed inset-0` that has `z-[9999]` or `z-[100]` and wrap it.

}
