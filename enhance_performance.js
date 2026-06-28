const fs = require('fs');

const path = 'src/app/employee/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const newPerformanceTab = `
          {activeTab === "performance" && (
            <div className="space-y-6">
              {/* Performance Cards - 4 in one row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Assigned", value: performanceStats.totalAssigned, icon: <FileText className="w-5 h-5" />, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
                  { label: "Completed", value: performanceStats.totalCompleted, icon: <CheckCircle2 className="w-5 h-5" />, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
                  { label: "Completion Rate", value: \`\${performanceStats.completionRate}%\`, icon: <Star className="w-5 h-5" />, bg: "bg-primary-50", text: "text-primary-600", border: "border-primary-200" },
                  { label: "SLA Breached", value: performanceStats.slaBreached, icon: <AlertTriangle className="w-5 h-5" />, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
                ].map(({ label, value, icon, bg, text, border }) => (
                  <div key={label} className={\`bg-white border \${border} rounded-none shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow\`}>
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                         <div className={\`\${bg} \${text} p-1.5 rounded-none\`}>{icon}</div>
                      </div>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
                  </div>
                ))}
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-600" /> Recent Operations</h3>
                      <button onClick={() => setActiveTab("dashboard")} className="text-emerald-600 text-[11px] font-bold hover:underline uppercase tracking-wider">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {myIssues.slice(0, 5).map(issue => (
                        <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => { setActiveTab("active"); setExpandedIssueId(issue.id); }}>
                          {issue.imageBase64 && <img src={issue.imageBase64} className="w-12 h-12 rounded-none object-cover flex-shrink-0 border border-slate-200" alt="" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-none">{issue.id}</span>
                              <span className={\`text-[9px] font-black uppercase px-2 py-0.5 rounded-none \${issue.status === "Closed" || issue.status === "Work Completed" ? "bg-emerald-100 text-emerald-700" : issue.status === "In Progress" || issue.status === "Work In Progress" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}\`}>{issue.status}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm truncate">{issue.description ? issue.description.substring(0, 50) + "..." : "Issue Report"}</h4>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                             <div>{new Date(issue.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                      {myIssues.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No recent assignments found.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                  {/* Issue Breakdown */}
                  <div className="bg-white border border-emerald-100 rounded-none shadow-sm">
                    <div className="border-b border-emerald-100 bg-emerald-50/50 p-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Issue Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-[#F4F9F5]/50">
                      {[
                        { label: "Critical", value: criticalIssues.length, color: "bg-rose-500" },
                        { label: "High", value: highPriorityIssues.length, color: "bg-orange-500" },
                        { label: "In Progress", value: inProgressIssues.length, color: "bg-amber-500" },
                        { label: "Completed", value: completedIssues.length, color: "bg-emerald-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center p-3 bg-white border border-emerald-100 rounded-none shadow-sm">
                          <div className={\`w-2 h-2 rounded-full \${color} mx-auto mb-2 shadow-inner-soft\`} />
                          <p className="text-2xl font-black text-slate-900">{value}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
`;

content = content.replace(/{\/\* ═══ PERFORMANCE TAB ═══ \*\/}.*?(?={\/\* ═══ EMPLOYEE LIVE TRACKING MAP ═══ \*\/}|\s*<\/div>\s*<\/main>)/s, "{/* ═══ PERFORMANCE TAB ═══ */}\n" + newPerformanceTab + "\n");

fs.writeFileSync(path, content, 'utf8');

console.log("Performance tab enhanced for Employee portal.");
