"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Plus, X, Users, MapPin, LogOut, UserCog, UserCircle, Briefcase, Building2, TrendingUp, Search, CheckCircle2, AlertTriangle, RefreshCw, Trash2, Star, Filter } from "lucide-react";
import { AppUser } from "@/lib/storage";

export default function SuperAdminPage() {
  const { user, appUser, role, loading, logoutMock } = useAuth();
  const router = useRouter();
  
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  
  const [activeTab, setActiveTab] = useState<"admins" | "employees" | "volunteer_orgs" | "area_adoptions" | "audit_logs" | "ai_report" | "overdue_escalations">("admins");

  // Prompt 4B States
  const [adoptedAreas, setAdoptedAreas] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [aiReportGenerating, setAiReportGenerating] = useState(false);
  const [aiReportData, setAiReportData] = useState<any>(null);

  // Volunteer Orgs
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [orgStateFilter, setOrgStateFilter] = useState("");
  const [orgCityFilter, setOrgCityFilter] = useState("");
  const [orgStatusFilter, setOrgStatusFilter] = useState("ALL");
  const [orgSearch, setOrgSearch] = useState("");
  const [orgActionLoading, setOrgActionLoading] = useState(false);
  
  // Admin Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Employee Creation Modal
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpPassword, setNewEmpPassword] = useState("");
  const [selectedAdminEmail, setSelectedAdminEmail] = useState("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!appUser) {
        router.push("/login");
      } else if (role !== "super_admin") {
        router.push("/");
      } else {
        loadData();
      }
    }
  }, [user, role, loading, router]);

  const loadData = async () => {
    try {
      const [usersRes, orgsRes, areasRes, auditRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/volunteer-org"),
        fetch("/api/adopted-areas"),
        fetch("/api/audit", { headers: { "x-user-role": "super_admin" } })
      ]);
      const allUsers = await usersRes.json();
      setAdmins(allUsers.filter((u: any) => u.role === "admin"));
      setEmployees(allUsers.filter((u: any) => u.role === "employee"));
      if (orgsRes.ok) {
        const orgs = await orgsRes.json();
        setAllOrgs(Array.isArray(orgs) ? orgs : []);
      }
      if (areasRes.ok) setAdoptedAreas(await areasRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newState) return;
    
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        name: newName,
        role: "admin",
        state: newState,
        city: newCity || undefined,
        department: newDepartment || undefined,
        password: newPassword || undefined
      })
    });
    
    setIsModalOpen(false);
    setNewEmail("");
    setNewName("");
    setNewState("");
    setNewCity("");
    setNewDepartment("");
    setNewPassword("");
    loadData();
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpEmail || !newEmpName || !selectedAdminEmail) return;
    
    const targetAdmin = admins.find(a => a.email === selectedAdminEmail);
    if (!targetAdmin) {
        alert("Selected admin not found!");
        return;
    }

    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmpEmail,
        name: newEmpName,
        role: "employee",
        state: targetAdmin.state,
        city: targetAdmin.city,
        department: targetAdmin.department,
        password: newEmpPassword || undefined,
        isAvailable: true,
        createdByAdmin: selectedAdminEmail  // Link employee to their admin
      })
    });
    
    setIsEmployeeModalOpen(false);
    setNewEmpEmail("");
    setNewEmpName("");
    setNewEmpPassword("");
    setSelectedAdminEmail("");
    loadData();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !newAdminPassword) return;
    
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...appUser,
        password: newAdminPassword
      })
    });

    setIsPasswordModalOpen(false);
    setNewAdminPassword("");
    alert("Password updated successfully.");
  };

  const handleSuperOrgAction = async (orgId: string, action: string, message?: string) => {
    setOrgActionLoading(true);
    try {
      if (action === "delete") {
        await fetch(`/api/volunteer-org/${orgId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/volunteer-org/${orgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            actorEmail: appUser?.email || "superadmin",
            actorName: appUser?.name || "Super Admin",
            actorRole: "super_admin",
            message: message || undefined,
          }),
        });
      }
      await loadData();
    } finally {
      setOrgActionLoading(false);
    }
  };

  if (loading || !appUser || role !== "super_admin") {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              Super Admin Control Center
            </h1>
            <p className="text-slate-500 mt-2">Manage geographical administrators and global employees.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors hidden sm:flex"
            >
              Change Password
            </button>
            <button
              onClick={() => {
                logoutMock();
                router.push("/");
              }}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
            </button>
            {activeTab === "admins" ? (
                <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                >
                <Plus className="w-5 h-5" /> Add New Admin
                </button>
            ) : (
                <button 
                onClick={() => setIsEmployeeModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                <Plus className="w-5 h-5" /> Add New Employee
                </button>
            )}
            
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
            <button
                onClick={() => setActiveTab("admins")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "admins" ? "bg-indigo-100 text-indigo-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <UserCog className="w-5 h-5" /> Admins ({admins.length})
            </button>
            <button
                onClick={() => setActiveTab("employees")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "employees" ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <UserCircle className="w-5 h-5" /> Employees ({employees.length})
            </button>
            <button
                onClick={() => setActiveTab("volunteer_orgs")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "volunteer_orgs" ? "bg-teal-100 text-teal-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <Briefcase className="w-5 h-5" /> Volunteer Orgs ({allOrgs.length})
                {allOrgs.filter(o => o.status === "PENDING_VERIFICATION").length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {allOrgs.filter(o => o.status === "PENDING_VERIFICATION").length}
                  </span>
                )}
            </button>
            <button
                onClick={() => setActiveTab("area_adoptions")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "area_adoptions" ? "bg-purple-100 text-purple-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <MapPin className="w-5 h-5" /> Area Adoptions ({adoptedAreas.length})
            </button>
            <button
                onClick={() => setActiveTab("audit_logs")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "audit_logs" ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <Briefcase className="w-5 h-5" /> Audit Logs
            </button>
            <button
                onClick={() => setActiveTab("ai_report")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "ai_report" ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <TrendingUp className="w-5 h-5" /> AI Monthly Report
            </button>
            <button
                onClick={() => setActiveTab("overdue_escalations")}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${activeTab === "overdue_escalations" ? "bg-red-100 text-red-700" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
            >
                <AlertTriangle className="w-5 h-5" /> Overdue Escalations
            </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {activeTab === "admins" && (
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-bold uppercase tracking-wider">
                    <th className="p-4">Admin Details</th>
                    <th className="p-4">Jurisdiction State</th>
                    <th className="p-4">Jurisdiction City</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Role Type</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {admins.length === 0 ? (
                    <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        No admins created yet. Add one to start delegating issues!
                    </td>
                    </tr>
                ) : admins.map((admin) => (
                    <tr key={admin.email} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <div className="font-bold text-slate-900">{admin.name}</div>
                        <div className="text-sm text-slate-500">{admin.email}</div>
                    </td>
                    <td className="p-4">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400" /> {admin.state}
                        </span>
                    </td>
                    <td className="p-4">
                        {admin.city ? (
                        <span className="font-medium text-slate-700">{admin.city}</span>
                        ) : (
                        <span className="text-slate-400 italic">Entire State</span>
                        )}
                    </td>
                    <td className="p-4">
                        <span className="font-bold text-slate-700">{admin.department || "All Departments"}</span>
                    </td>
                    <td className="p-4">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {admin.city ? 'City Admin' : 'State Admin'}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
          {activeTab === "employees" && (
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-bold uppercase tracking-wider">
                    <th className="p-4">Employee Details</th>
                    <th className="p-4">Assigned State</th>
                    <th className="p-4">Assigned City</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {employees.length === 0 ? (
                    <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        No employees created yet.
                    </td>
                    </tr>
                ) : employees.map((emp) => (
                    <tr key={emp.email} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-sm text-slate-500">{emp.email}</div>
                    </td>
                    <td className="p-4">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400" /> {emp.state}
                        </span>
                    </td>
                    <td className="p-4">
                        {emp.city ? (
                        <span className="font-medium text-slate-700">{emp.city}</span>
                        ) : (
                        <span className="text-slate-400 italic">Entire State</span>
                        )}
                    </td>
                    <td className="p-4">
                        <span className="font-bold text-slate-700">{emp.department || "All Departments"}</span>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${emp.isAvailable !== false ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                            {emp.isAvailable !== false ? 'On Duty' : 'Off Duty'}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
          {activeTab === "volunteer_orgs" && (() => {
            const filteredOrgs = allOrgs.filter((org: any) => {
              const matchState = !orgStateFilter || org.state?.toLowerCase().includes(orgStateFilter.toLowerCase());
              const matchCity = !orgCityFilter || org.city?.toLowerCase().includes(orgCityFilter.toLowerCase());
              const matchStatus = orgStatusFilter === "ALL" || org.status === orgStatusFilter;
              const matchSearch = !orgSearch || org.name.toLowerCase().includes(orgSearch.toLowerCase()) || org.contactEmail.toLowerCase().includes(orgSearch.toLowerCase());
              return matchState && matchCity && matchStatus && matchSearch;
            });

            const stats = {
              total: allOrgs.length,
              pending: allOrgs.filter(o => o.status === "PENDING_VERIFICATION").length,
              verified: allOrgs.filter(o => o.status === "VERIFIED").length,
              rejected: allOrgs.filter(o => o.status === "REJECTED").length,
              suspended: allOrgs.filter(o => o.status === "SUSPENDED").length,
            };

            return (
              <div className="space-y-5">
                {/* Analytics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Orgs", value: stats.total, color: "bg-slate-50 border-slate-200", text: "text-slate-700" },
                    { label: "Pending", value: stats.pending, color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
                    { label: "Verified", value: stats.verified, color: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
                    { label: "Suspended", value: stats.suspended, color: "bg-red-50 border-red-200", text: "text-red-700" },
                  ].map(s => (
                    <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
                      <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={orgSearch} onChange={e => setOrgSearch(e.target.value)}
                      placeholder="Search org name or email..."
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <input type="text" value={orgStateFilter} onChange={e => setOrgStateFilter(e.target.value)}
                    placeholder="Filter by state"
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36" />
                  <input type="text" value={orgCityFilter} onChange={e => setOrgCityFilter(e.target.value)}
                    placeholder="Filter by city"
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36" />
                  <select value={orgStatusFilter} onChange={e => setOrgStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING_VERIFICATION">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                {/* Org List */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  {filteredOrgs.length === 0 ? (
                    <div className="text-center py-16">
                      <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No organizations match your filters</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredOrgs.map((org: any) => (
                        <div key={org._id} className="p-5 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-teal-100 flex-shrink-0 flex items-center justify-center border border-slate-200">
                              {org.logoUrl ? <img src={org.logoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-teal-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-black text-slate-900">{org.name}</h3>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  org.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" :
                                  org.status === "PENDING_VERIFICATION" ? "bg-amber-100 text-amber-700" :
                                  org.status === "SUSPENDED" ? "bg-slate-100 text-slate-600" :
                                  "bg-red-100 text-red-700"
                                }`}>{org.status.replace(/_/g, " ")}</span>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{org.city}, {org.state}</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.activeMembers} members</span>
                                <span className="flex items-center gap-1"><Star className="w-3 h-3" />Trust: {org.trustScore}/100</span>
                                <span className="flex items-center gap-1">{org.type}</span>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                              {org.status === "PENDING_VERIFICATION" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "approved")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                                  <CheckCircle2 className="w-3 h-3" /> Approve
                                </button>
                              )}
                              {org.status === "PENDING_VERIFICATION" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "rejected", "Rejected by Super Admin")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              )}
                              {org.status === "VERIFIED" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "suspended", "Suspended by Super Admin")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                                  <AlertTriangle className="w-3 h-3" /> Suspend
                                </button>
                              )}
                              {org.status === "SUSPENDED" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "reactivated")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                                  <RefreshCw className="w-3 h-3" /> Reactivate
                                </button>
                              )}
                              <button onClick={() => { if (confirm(`Delete "${org.name}"? This cannot be undone.`)) handleSuperOrgAction(org._id, "delete"); }} disabled={orgActionLoading}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50">
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {activeTab === "overdue_escalations" && (
            <div className="p-8">
              <div className="mb-6 flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" /> Overdue Issues (SLA Breached)
                </h2>
                <button 
                   onClick={async () => {
                     try {
                       const res = await fetch("/api/cron/sla");
                       const data = await res.json();
                       alert(data.message || "Cron executed.");
                     } catch (e) {
                       alert("Error executing SLA cron.");
                     }
                   }}
                   className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                   Run SLA Cron Now
                </button>
              </div>
              <p className="text-slate-500 font-medium italic">These issues have breached their expected completion time.</p>
              {/* List will go here if we fetched them. For now this is a placeholder panel for the dashboard. */}
            </div>
          )}

        </div>
      </div>

      {/* Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create Administrator</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clerk Account Email</label>
                <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">State</label>
                  <input required type="text" value={newState} onChange={e => setNewState(e.target.value)} placeholder="e.g. Haryana" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">City (Optional)</label>
                  <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Leave blank for whole state" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                  <select required value={newDepartment} onChange={e => setNewDepartment(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900">
                    <option value="">Select Department...</option>
                    <option value="Roads Department">Roads Department</option>
                    <option value="Electricity Department">Electricity Department</option>
                    <option value="Water Department">Water Department</option>
                    <option value="Municipal Committee">Municipal Committee</option>
                    <option value="Animal Control">Animal Control</option>
                    <option value="Traffic Police">Traffic Police</option>
                    <option value="Parks Department">Parks Department</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Initial Password</label>
                  <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Assign a custom password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl mt-4">
                Create Admin Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create Employee</h2>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Assign Under Admin</label>
                <select required value={selectedAdminEmail} onChange={e => setSelectedAdminEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900">
                    <option value="">Select an Admin...</option>
                    {admins.map(a => (
                        <option key={a.email} value={a.email}>{a.name} ({a.department || "All"}) - {a.city ? `${a.city}, ` : ''}{a.state}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">The employee will automatically inherit the jurisdiction and department of the selected admin.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Employee Name</label>
                <input required type="text" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Login Email</label>
                <input required type="email" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Initial Password</label>
                <input required type="text" value={newEmpPassword} onChange={e => setNewEmpPassword(e.target.value)} placeholder="Assign a custom password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl mt-4">
                Create Employee Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                <input 
                  type="password" 
                  required
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Area Adoptions Tab */}
      {activeTab === "area_adoptions" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-600" /> Global Area Adoptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-xs uppercase text-slate-500 font-bold">
                  <th className="p-4">Area Name</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adoptedAreas.map(area => (
                  <tr key={area._id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{area.name}</td>
                    <td className="p-4 text-slate-600">{area.location}, {area.city}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${area.status === "ADOPTED" ? "bg-emerald-100 text-emerald-700" : area.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {area.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{area.durationMonths} Months</td>
                    <td className="p-4">
                      {area.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            await fetch(`/api/adopted-areas/${area._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "ADOPTED", adminEmail: appUser.email, adminRole: "super_admin" }) });
                            loadData();
                          }} className="bg-emerald-600 text-white px-3 py-1 rounded font-bold text-xs">Approve</button>
                          <button onClick={async () => {
                            await fetch(`/api/adopted-areas/${area._id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ status: "REJECTED", adminEmail: appUser.email, adminRole: "super_admin" }) });
                            loadData();
                          }} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded font-bold text-xs">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit_logs" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-amber-600" /> Global Audit Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-xs uppercase text-slate-500 font-bold">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{log.actionType}</td>
                    <td className="p-4 text-sm text-slate-600">{log.actorEmail} <span className="text-[10px] bg-slate-100 px-2 rounded text-slate-400 uppercase">{log.actorRole}</span></td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{log.targetEntityId}</td>
                    <td className="p-4 text-sm font-bold text-emerald-600">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Report Tab */}
      {activeTab === "ai_report" && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> AI Monthly Impact Report</h2>
          <p className="text-slate-600 mb-6">Generate an AI-powered summary of platform health, municipal performance, and volunteer engagement.</p>
          
          {!aiReportData ? (
             <button disabled={aiReportGenerating} onClick={async () => {
               setAiReportGenerating(true);
               // Mocking AI report generation
               setTimeout(() => {
                 setAiReportData({
                   title: "Monthly Impact & Health Summary",
                   highlights: [
                     "Resolved issues increased by 14% compared to last month.",
                     "12 new volunteer organizations were onboarded and verified.",
                     "AI successfully filtered 150+ suspicious reports, saving 40 hours of admin time."
                   ],
                   recommendations: [
                     "Consider re-allocating staff to the 'Water Department' due to a 20% spike in related issues.",
                     "Push a community challenge in 'Downtown' to address the low volunteer participation rate in that sector."
                   ],
                   date: new Date().toLocaleDateString()
                 });
                 setAiReportGenerating(false);
               }, 2000);
             }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
               {aiReportGenerating ? "Generating Report..." : "Generate Report with Google Gemini"}
             </button>
          ) : (
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h3 className="text-2xl font-black text-slate-900 mb-2">{aiReportData.title}</h3>
                <p className="text-sm text-slate-500 mb-6">Generated on {aiReportData.date}</p>
                
                <h4 className="font-bold text-emerald-700 mb-2 uppercase tracking-wide text-sm">Key Highlights</h4>
                <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2">
                  {aiReportData.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}
                </ul>
                
                <h4 className="font-bold text-indigo-700 mb-2 uppercase tracking-wide text-sm">Actionable Recommendations</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-2">
                  {aiReportData.recommendations.map((h: string, i: number) => <li key={i}>{h}</li>)}
                </ul>
                
                <button onClick={() => setAiReportData(null)} className="mt-8 text-sm font-bold text-slate-500 hover:text-slate-700">Dismiss Report</button>
             </div>
          )}
        </div>
      )}

    </div>
  );
}
