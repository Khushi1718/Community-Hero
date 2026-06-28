const fs = require('fs');

const path = 'src/app/volunteer-org/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const newProfileTab = `
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in pb-12">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Organization Profile</h2>
                  <p className="text-slate-500 font-medium mt-1">Official registry and operational details.</p>
                </div>
                <button
                  onClick={() => { setEditMode(!editMode); setEditForm(org || {}); }}
                  className="flex items-center gap-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] uppercase tracking-wider px-4 py-2 rounded-none transition-all shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> {editMode ? "Cancel Editing" : "Modify Record"}
                </button>
              </div>

              {/* Cover & Master Info Container */}
              <div className="bg-white border border-emerald-100 rounded-none shadow-sm overflow-hidden">
                <div className="h-48 bg-emerald-950 relative border-b border-emerald-900">
                  {org?.coverImageUrl && <img src={org.coverImageUrl} alt="Cover" className="w-full h-full object-cover opacity-80 mix-blend-overlay" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent"></div>
                  
                  {/* Absolute Info on Cover */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                     <div className="flex items-end gap-6">
                       <div className="w-24 h-24 border-2 border-emerald-500 bg-white flex items-center justify-center p-2 shadow-lg">
                          {org?.logoUrl
                            ? <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            : <Building2 className="w-12 h-12 text-emerald-900" />
                          }
                       </div>
                       <div className="pb-2">
                         <div className="flex items-center gap-3 mb-2">
                            <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none shadow-sm border border-emerald-400">Verified Entity</span>
                            {org?.verifiedBy && (
                               <span className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-emerald-400"/> Authenticated by {org.verifiedBy}
                               </span>
                            )}
                         </div>
                         <h2 className="text-3xl font-black text-white tracking-tight leading-none shadow-sm">{org?.name}</h2>
                       </div>
                     </div>
                  </div>
                </div>

                <div className="p-0">
                  {editMode ? (
                    <div className="p-8 space-y-6 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Registered Entity Name</label>
                          <input type="text" value={editForm.name || ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Primary Contact Phone</label>
                          <input type="tel" value={editForm.contactPhone || ""} onChange={e => setEditForm(f => ({ ...f, contactPhone: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Operational Description</label>
                          <textarea rows={3} value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none resize-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Core Mission Statement</label>
                          <textarea rows={2} value={editForm.mission || ""} onChange={e => setEditForm(f => ({ ...f, mission: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-medium text-emerald-900 focus:border-emerald-500 focus:outline-none resize-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Official Portal (Website)</label>
                          <input type="url" value={editForm.website || ""} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Liaison Officer</label>
                          <input type="text" value={editForm.contactPersonName || ""} onChange={e => setEditForm(f => ({ ...f, contactPersonName: e.target.value }))}
                            className="w-full border-2 border-emerald-100 bg-white rounded-none px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors" />
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-6">
                        <button onClick={handleSaveProfile} disabled={editSaving}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] uppercase tracking-wider px-8 py-3 rounded-none flex items-center justify-center gap-2 disabled:opacity-60 transition-colors w-full sm:w-auto">
                          {editSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Commit Changes to Registry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-emerald-100 border-b border-emerald-100 bg-emerald-50/30">
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Shield className="w-3 h-3 text-emerald-600"/> Registration No.</p>
                          <p className="font-black text-slate-900 text-xl tracking-tight">{org?.registrationNumber || "PENDING"}</p>
                        </div>
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Users className="w-3 h-3 text-emerald-600"/> Total Personnel</p>
                          <p className="font-black text-slate-900 text-xl tracking-tight">{org?.activeMembers || 0}</p>
                        </div>
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Award className="w-3 h-3 text-emerald-600"/> Trust Score</p>
                          <div className="flex items-end gap-1">
                             <p className="font-black text-emerald-700 text-xl tracking-tight">{org?.trustScore || 0}</p>
                             <p className="font-bold text-slate-400 text-sm mb-0.5">/100</p>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin className="w-3 h-3 text-emerald-600"/> Jurisdiction</p>
                          <p className="font-black text-slate-900 text-sm">{org?.city}</p>
                          <p className="font-bold text-slate-500 text-xs">{org?.state}</p>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                         <div className="md:col-span-2 space-y-8">
                            <div>
                               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Operational Overview</h3>
                               <p className="text-slate-700 text-sm leading-relaxed font-medium">{org?.description || "No operational description provided."}</p>
                            </div>
                            
                            {org?.mission && (
                              <div className="bg-emerald-950 border border-emerald-900 rounded-none p-6 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                   <Target className="w-24 h-24 text-emerald-500" />
                                </div>
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 relative z-10">Core Mission Directive</h3>
                                <p className="text-emerald-50 text-sm font-medium leading-relaxed relative z-10 italic">"{org.mission}"</p>
                              </div>
                            )}
                         </div>

                         <div className="space-y-8">
                            <div>
                               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Registered Capabilities</h3>
                               <div className="flex flex-col gap-2">
                                 {org?.workCategories?.map(cat => (
                                   <div key={cat} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-none flex items-center gap-2 shadow-sm">
                                     <span className="text-emerald-600">{CATEGORY_ICONS[cat]}</span> {cat}
                                   </div>
                                 ))}
                                 {(!org?.workCategories || org.workCategories.length === 0) && (
                                   <p className="text-xs text-slate-400 italic">No capabilities registered.</p>
                                 )}
                               </div>
                            </div>
                            
                            <div>
                               <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Contact Matrix</h3>
                               <div className="space-y-3">
                                  {org?.contactPersonName && (
                                    <div className="flex items-start gap-3">
                                      <UserCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Liaison Officer</p>
                                         <p className="text-xs font-bold text-slate-800">{org.contactPersonName}</p>
                                      </div>
                                    </div>
                                  )}
                                  {org?.contactPhone && (
                                    <div className="flex items-start gap-3">
                                      <Phone className="w-4 h-4 text-emerald-600 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Contact</p>
                                         <p className="text-xs font-bold text-slate-800">{org.contactPhone}</p>
                                      </div>
                                    </div>
                                  )}
                                  {org?.website && (
                                    <div className="flex items-start gap-3">
                                      <Globe className="w-4 h-4 text-emerald-600 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Official Portal</p>
                                         <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:underline">{org.website.replace(/^https?:\\/\\//, '')}</a>
                                      </div>
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
`;

content = content.replace(/{\/\* ── PROFILE ─────────────────────────────────────────────── \*\/}.*?(?={\/\* ── NOTIFICATIONS ────────────────────────────────────────── \*\/}|\s*<\/div>\s*<\/main>)/s, "{/* ── PROFILE ─────────────────────────────────────────────── */}\n" + newProfileTab + "\n          ");

fs.writeFileSync(path, content, 'utf8');

console.log("Profile tab enhanced for Volunteer Org portal.");
