const fs = require('fs');

const file = 'src/app/volunteer-org/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { ModalPortal }')) {
  content = content.replace(/(import .* from "recharts";)/, '$1\nimport { ModalPortal } from "@/components/ModalPortal";');
}

// Map of modal names to their exact start string to replace
const modals = [
  'selectedDrive && (',
  'showCompletionModal && selectedDrive && (',
  'isCreateDriveModalOpen && (',
  'isScheduleDriveModalOpen && selectedDrive && (',
  'isEditCapacityModalOpen && selectedDrive && (',
  'isEditDriveModalOpen && selectedDrive && (',
  'isAddPartnerModalOpen && ('
];

for (const modal of modals) {
  const startStr = `{${modal}\n         <div className="fixed inset-0`;
  const replacementStr = `{${modal}\n         <ModalPortal>\n         <div className="fixed inset-0`;
  
  const startStr2 = `{${modal}\n        <div className="fixed inset-0`;
  const replacementStr2 = `{${modal}\n        <ModalPortal>\n        <div className="fixed inset-0`;

  content = content.replace(startStr, replacementStr);
  content = content.replace(startStr2, replacementStr2);
}

// Now replace closing tags.
// Each of these modals ends with:
//         </div>
//       )}
// Let's replace:
//         </div>
//       )}
// with:
//         </div>
//         </ModalPortal>
//       )}

// But wait, there might be other places matching this.
// Let's manually replace based on line contents.
// The end lines for these modals were: 1748, 1838, 1917, 1973, 2012, 2071, 2136
// Since we inserted `<ModalPortal>` 7 times, the line numbers shift!

