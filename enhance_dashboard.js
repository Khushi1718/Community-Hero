const fs = require('fs');

const adminPath = 'src/app/admin/page.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Remove certificates from navItems
adminContent = adminContent.replace(/{\s*id:\s*"certificates"[^}]*},\s*/g, '');

// The user also requested to enhance the dashboard with nice information.
// Currently the "Dashboard Overview" (activeTab === "home") has KPI Cards and Recent Issues.
// Let's add an "Active Field Operations" section next to Recent Issues, or just improve the layout of it.
// In the current layout, it is:
// <div className="space-y-6">
//   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"> ... KPI Cards ... </div>
//   <Card className="border-emerald-100"> ... Recent Issues ... </Card>
// </div>

// We can make the dashboard more official and data-rich by putting Recent Issues and Team Status in a grid.
const newDashboardContent = `
          {/* ════ OVERVIEW TAB ════ */}
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Alert Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex items-start gap-3 shadow-sm">
                 <div className="bg-emerald-100 p-2 rounded-sm mt-0.5"><Activity className="w-5 h-5 text-emerald-700" /></div>
                 <div>
                    <h4 className="font-bold text-emerald-900 text-sm">System Normal</h4>
                    <p className="text-xs text-emerald-700 mt-1">All core municipal services in your jurisdiction are operating within normal parameters. {pendingIssues.length} issues require attention.</p>
                 </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Open Issues", value: kpi.open, icon: <FileText className="w-5 h-5" />, color: "info", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", sub: "Awaiting action" },
                  { label: "In Progress", value: kpi.inProgress, icon: <TrendingUp className="w-5 h-5" />, color: "warning", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", sub: "Being worked on" },
                  { label: "Resolved", value: kpi.resolved, icon: <CheckCircle2 className="w-5 h-5" />, color: "success", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", sub: "Completed" },
                  { label: "Escalated", value: kpi.escalated, icon: <AlertTriangle className="w-5 h-5" />, color: "error", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", sub: "Over 7 days old" },
                ].map(({ label, value, icon, bg, text, border, sub }) => (
                  <div key={label} className={\`bg-white border \${border} rounded-sm shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow\`}>
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                         <div className={\`\${bg} \${text} p-1.5 rounded-sm\`}>{icon}</div>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Detailed Grids */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main feed - takes up 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600" /> Recent Operations</h3>
                      <button onClick={() => setActiveTab("live")} className="text-emerald-600 text-[11px] font-bold hover:underline uppercase tracking-wider">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {allIssues.slice(0, 5).map(issue => (
                        <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => { setActiveTab("live"); setExpandedIssueId(issue.id); }}>
                          {issue.imageBase64 && <img src={issue.imageBase64} className="w-12 h-12 rounded-sm object-cover flex-shrink-0 border border-slate-200" alt="" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{issue.id}</span>
                              <span className={\`text-[9px] font-black uppercase px-2 py-0.5 rounded \${issue.status === IssueStatus.RESOLVED ? "bg-emerald-100 text-emerald-700" : issue.status === IssueStatus.IN_PROGRESS ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}\`}>{issue.status}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm truncate">{issue.title}</h4>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                             <div>{new Date(issue.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                      {allIssues.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No recent issues found.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side panel - takes up 1 column */}
                <div className="space-y-6">
                  {/* Team Status */}
                  <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 p-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600" /> Field Personnel</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {employees.slice(0, 4).map(emp => (
                        <div key={emp.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200">
                               {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                               <p className="text-[10px] text-slate-500 uppercase">{emp.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={\`w-2 h-2 rounded-full \${emp.isOnDuty ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}\`}></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{emp.isOnDuty ? 'Active' : 'Offline'}</span>
                          </div>
                        </div>
                      ))}
                      {employees.length === 0 && (
                        <p className="text-xs text-slate-500 text-center py-4">No personnel registered.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
`;

adminContent = adminContent.replace(/{\/\* ════ OVERVIEW TAB ════ \*\/}.*?(?={\/\* ════ LIVE REPORTS TAB ════ \*\/})/s, newDashboardContent + "\n\n          ");

fs.writeFileSync(adminPath, adminContent, 'utf8');

console.log("Dashboard enhanced and certificates removed.");
