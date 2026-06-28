const fs = require('fs');

const path = 'src/app/super-admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const newTabsContent = `
      {/* AI Report Tab */}
      {activeTab === "ai_report" && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
             <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Monthly Impact Report</h2>
                <p className="text-xs text-slate-500 mt-1">Generates an automated executive summary using Google Gemini based on live database metrics.</p>
             </div>
             <button
                onClick={async () => {
                  setAiReportGenerating(true);
                  try {
                    const res = await fetch("/api/reports/monthly", { headers: { "x-user-role": "super_admin" } });
                    const data = await res.json();
                    if (data.report) {
                       setAiReportData(data.report);
                    }
                  } catch(e) {}
                  setAiReportGenerating(false);
                }}
                disabled={aiReportGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded text-[11px] uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50"
             >
                {aiReportGenerating ? "Generating Report..." : "Generate AI Report"}
             </button>
          </div>
          {aiReportData ? (
             <div className="prose prose-sm max-w-none prose-slate bg-emerald-50/30 p-6 rounded border border-emerald-100 whitespace-pre-wrap">
               {aiReportData}
             </div>
          ) : (
             <div className="text-center py-12 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded">
                No report generated yet. Click the button above to analyze this month's data.
             </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit_logs" && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">System Audit Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-300 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Target Resource</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No audit logs found in the database.</td>
                  </tr>
                ) : auditLogs.map(log => (
                  <tr key={log._id} className="border-b border-slate-200 hover:bg-slate-50 text-xs">
                    <td className="p-4 text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-800">{log.action}</td>
                    <td className="p-4">
                      <div className="text-slate-900">{log.userId}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.userRole}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[10px]">{log.targetResourceType}: {log.targetResourceId}</td>
                    <td className="p-4">
                      <span className={\`px-2 py-0.5 rounded font-bold text-[9px] uppercase \${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

content = content.replace(/{\/\* AI Report Tab \*\/}.*?(?={\/\* Admin Modal \*\/})/s, newTabsContent + "\n\n        </div>\n      </div>\n\n      ");
content = content.replace(/{\/\* AI Report Tab \*\/}.*?(?={\/\* Add Organization Modal \*\/})/s, "");

content = content.replace(/<div className="min-h-screen bg-slate-50 p-8">/, '<div className="min-h-screen bg-[#F4F9F5] p-8">');
content = content.replace(/STATE CONTROL CENTER/, '<span className="text-emerald-700">STATE</span> CONTROL CENTER');

// The first replace fixes Change Password
content = content.replace(
  /className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-\[11px\] uppercase tracking-wider font-bold border border-slate-300 shadow-sm transition-colors"/,
  'className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-emerald-200 shadow-sm transition-colors"'
);
// The second replace fixes CRM Integrations since we only replaced the first match above
content = content.replace(
  /className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-\[11px\] uppercase tracking-wider font-bold border border-slate-300 shadow-sm transition-colors"/,
  'className="bg-teal-50 hover:bg-teal-100 text-teal-800 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-teal-200 shadow-sm transition-colors"'
);

fs.writeFileSync(path, content, 'utf8');
