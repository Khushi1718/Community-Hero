const fs = require('fs');

const path = 'src/app/super-admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard tabs with standard official tabs
const newTabs = `
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px">
            <button
                onClick={() => setActiveTab("admins")}
                className={\`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 \${activeTab === "admins" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}\`}
            >
                Admins ({admins.length})
            </button>
            <button
                onClick={() => setActiveTab("employees")}
                className={\`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 \${activeTab === "employees" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}\`}
            >
                Employees ({employees.length})
            </button>
            <button
                onClick={() => setActiveTab("volunteer_orgs")}
                className={\`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 \${activeTab === "volunteer_orgs" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}\`}
            >
                Volunteer Orgs ({allOrgs.length})
            </button>
            <button
                onClick={() => setActiveTab("area_adoptions")}
                className={\`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 \${activeTab === "area_adoptions" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}\`}
            >
                State Admins
            </button>
            <button
                onClick={() => setActiveTab("audit_logs")}
                className={\`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 \${activeTab === "audit_logs" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}\`}
            >
                Audit Logs
            </button>
            <button
                onClick={() => setActiveTab("ai_report")}
                className={\`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 \${activeTab === "ai_report" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}\`}
            >
                AI Monthly Report
            </button>
        </div>
`;

content = content.replace(/{\/\* Tabs \*\/}.*?(?=<div className="bg-white border)/s, newTabs);

// Update Header to remove shield and gradients
const newHeader = `
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-8 border-b border-slate-300 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              State Control Center
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">Global Jurisdiction & Platform Audit Management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-slate-300 shadow-sm transition-colors"
            >
              Change Password
            </button>
            <button
              onClick={() => router.push("/super-admin/settings/integrations")}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-slate-300 shadow-sm transition-colors"
            >
              CRM Integrations
            </button>
            <button
              onClick={() => {
                logoutMock();
                router.push("/");
              }}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-red-200 transition-colors"
            >
              Sign Out
            </button>
            {activeTab === "admins" && (
                <button 
                onClick={() => {
                  setNewCity("");
                  setNewDepartment("");
                  setIsModalOpen(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-[11px] uppercase tracking-wider shadow-sm transition-colors"
                >
                + Add Admin
                </button>
            )}
            {activeTab === "employees" && (
                <button 
                onClick={() => setIsEmployeeModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-[11px] uppercase tracking-wider shadow-sm transition-colors"
                >
                + Add Employee
                </button>
            )}
            {activeTab === "area_adoptions" && (
                <button 
                onClick={() => {
                   setNewCity("ALL");
                   setNewDepartment("ALL");
                   setIsModalOpen(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-[11px] uppercase tracking-wider shadow-sm transition-colors"
                >
                + Add State Admin
                </button>
            )}
          </div>
        </header>
`;

content = content.replace(/<div className="max-w-6xl mx-auto">.*?<\/header>/s, newHeader);

// Clean up Admin Table
content = content.replace(/rounded-3xl/g, "rounded-sm");
content = content.replace(/rounded-2xl/g, "rounded-sm");
content = content.replace(/rounded-xl/g, "rounded-sm");

// Redesign Area Adoptions
const newAreaAdoptions = `
      {/* Area Adoptions Tab */}
      {activeTab === "area_adoptions" && (
        <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">State-Level Administrators (Global Adoptions)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-300 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4">Admin Details</th>
                  <th className="p-4">Jurisdiction State</th>
                  <th className="p-4">Coverage</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.filter(a => a.city === "ALL" && a.department === "ALL").length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No State Admins found. Click '+ Add State Admin' to create one.</td>
                  </tr>
                ) : admins.filter(a => a.city === "ALL" && a.department === "ALL").map(admin => (
                  <tr key={admin.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{admin.name}</div>
                      <div className="text-slate-500 text-xs">{admin.email}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{admin.state}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded">ALL CITIES & DEPTS</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
`;

content = content.replace(/{\/\* Area Adoptions Tab \*\/}.*?(?={\/\* AI Report Tab \*\/})/s, newAreaAdoptions);

// Replace AI Report and Audit Log sections
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
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-[11px] uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50"
             >
                {aiReportGenerating ? "Generating Report..." : "Generate AI Report"}
             </button>
          </div>
          {aiReportData ? (
             <div className="prose prose-sm max-w-none prose-slate bg-slate-50 p-6 rounded border border-slate-200 whitespace-pre-wrap">
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

content = content.replace(/{\/\* AI Report Tab \*\/}.*?(?=\n\s*<\/div>\n\s*<\/div>\n\s*\)$)/s, newTabsContent);

fs.writeFileSync(path, content, 'utf8');
