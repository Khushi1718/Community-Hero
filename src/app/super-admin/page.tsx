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
  
  const [activeTab, setActiveTab] = useState<"admins" | "employees" | "volunteer_orgs" | "area_adoptions" | "audit_logs" | "overdue_escalations">("admins");

  // Prompt 4B States
  const [adoptedAreas, setAdoptedAreas] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

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

  // Add Org Modal
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [addOrgName, setAddOrgName] = useState("");
  const [addOrgEmail, setAddOrgEmail] = useState("");
  const [addOrgType, setAddOrgType] = useState("NGO");
  const [addOrgPassword, setAddOrgPassword] = useState("");
  const [addOrgState, setAddOrgState] = useState("");
  const [addOrgCity, setAddOrgCity] = useState("");
  const [addOrgAddress, setAddOrgAddress] = useState("");
  const [addOrgContactPerson, setAddOrgContactPerson] = useState("");
  const [addOrgPhone, setAddOrgPhone] = useState("");
  const [addOrgDescription, setAddOrgDescription] = useState("");
  const [addOrgSubmitting, setAddOrgSubmitting] = useState(false);

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

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOrgEmail || !addOrgName) return;
    setAddOrgSubmitting(true);
    try {
        const res = await fetch("/api/volunteer-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: addOrgName,
                type: addOrgType,
                description: addOrgDescription,
                contactEmail: addOrgEmail,
                contactPersonName: addOrgContactPerson,
                contactPhone: addOrgPhone,
                state: addOrgState,
                city: addOrgCity,
                address: addOrgAddress,
                password: addOrgPassword,
                createdByAdmin: true,
                adminEmail: appUser?.email,
                adminName: appUser?.name,
                adminRole: appUser?.role
            })
        });
        if (res.ok) {
            setIsAddOrgModalOpen(false);
            setAddOrgName(""); setAddOrgEmail(""); setAddOrgPassword(""); setAddOrgDescription("");
            setAddOrgCity(""); setAddOrgState(""); setAddOrgAddress("");
            setAddOrgContactPerson(""); setAddOrgPhone("");
            loadData();
        } else {
            const err = await res.json();
            alert(err.error || "Failed to add organization");
        }
    } catch (e) {
        alert("Error adding organization");
    } finally {
        setAddOrgSubmitting(false);
    }
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
    <div className="min-h-screen bg-[#F4F9F5] p-8">
      
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-8 border-b border-emerald-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              <span className="text-emerald-700">STATE</span> CONTROL CENTER
            </h1>
            <p className="text-slate-600 text-sm mt-1 font-medium">Global Jurisdiction & Platform Audit Management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-emerald-200 shadow-sm transition-colors"
            >
              Change Password
            </button>
            <button
              onClick={() => router.push("/super-admin/settings/integrations")}
              className="bg-teal-50 hover:bg-teal-100 text-teal-800 px-4 py-2 rounded text-[11px] uppercase tracking-wider font-bold border border-teal-200 shadow-sm transition-colors"
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


        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-emerald-100 pb-px">
            <button
                onClick={() => setActiveTab("admins")}
                className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "admins" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
                Admins ({admins.length})
            </button>
            <button
                onClick={() => setActiveTab("employees")}
                className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "employees" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
                Employees ({employees.length})
            </button>
            <button
                onClick={() => setActiveTab("volunteer_orgs")}
                className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "volunteer_orgs" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
                Volunteer Orgs ({allOrgs.length})
            </button>
            <button
                onClick={() => setActiveTab("area_adoptions")}
                className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "area_adoptions" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
                State Admins
            </button>
            <button
                onClick={() => setActiveTab("audit_logs")}
                className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "audit_logs" ? "border-slate-800 text-slate-900 bg-slate-100/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
            >
                Audit Logs
            </button>
        </div>
<div className="bg-white border border-emerald-100 rounded-sm shadow-sm overflow-hidden">
          {activeTab === "admins" && (
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-emerald-100 text-slate-500 text-sm font-bold uppercase tracking-wider">
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
                <tr className="bg-slate-50 border-b border-emerald-100 text-slate-500 text-sm font-bold uppercase tracking-wider">
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
                    { label: "Total Orgs", value: stats.total, color: "bg-slate-50 border-emerald-100", text: "text-slate-700" },
                    { label: "Pending", value: stats.pending, color: "bg-amber-50 border-amber-200", text: "text-amber-700" },
                    { label: "Verified", value: stats.verified, color: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
                    { label: "Suspended", value: stats.suspended, color: "bg-red-50 border-red-200", text: "text-red-700" },
                  ].map(s => (
                    <div key={s.label} className={`${s.color} border rounded-sm p-4 text-center`}>
                      <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                  <button onClick={() => setIsAddOrgModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Add Organization
                  </button>
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={orgSearch} onChange={e => setOrgSearch(e.target.value)}
                      placeholder="Search org name or email..."
                      className="w-full pl-9 pr-3 py-2.5 border border-emerald-100 rounded-sm text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <input type="text" value={orgStateFilter} onChange={e => setOrgStateFilter(e.target.value)}
                    placeholder="Filter by state"
                    className="border border-emerald-100 rounded-sm px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36" />
                  <input type="text" value={orgCityFilter} onChange={e => setOrgCityFilter(e.target.value)}
                    placeholder="Filter by city"
                    className="border border-emerald-100 rounded-sm px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36" />
                  <select value={orgStatusFilter} onChange={e => setOrgStatusFilter(e.target.value)}
                    className="border border-emerald-100 rounded-sm px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING_VERIFICATION">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                {/* Org List */}
                <div className="bg-white border border-emerald-100 rounded-sm overflow-hidden shadow-sm">
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
                            <div className="w-12 h-12 rounded-sm overflow-hidden bg-teal-100 flex-shrink-0 flex items-center justify-center border border-emerald-100">
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
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-sm disabled:opacity-50">
                                  <CheckCircle2 className="w-3 h-3" /> Approve
                                </button>
                              )}
                              {org.status === "PENDING_VERIFICATION" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "rejected", "Rejected by Super Admin")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-sm disabled:opacity-50">
                                  <X className="w-3 h-3" /> Reject
                                </button>
                              )}
                              {org.status === "VERIFIED" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "suspended", "Suspended by Super Admin")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-sm disabled:opacity-50">
                                  <AlertTriangle className="w-3 h-3" /> Suspend
                                </button>
                              )}
                              {org.status === "SUSPENDED" && (
                                <button onClick={() => handleSuperOrgAction(org._id, "reactivated")} disabled={orgActionLoading}
                                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-sm disabled:opacity-50">
                                  <RefreshCw className="w-3 h-3" /> Reactivate
                                </button>
                              )}
                              <button onClick={() => { if (confirm(`Delete "${org.name}"? This cannot be undone.`)) handleSuperOrgAction(org._id, "delete"); }} disabled={orgActionLoading}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-sm disabled:opacity-50">
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
          <div className="bg-white rounded-sm w-full max-w-lg p-8 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create Administrator</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clerk Account Email</label>
                <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">State</label>
                  <input required type="text" value={newState} onChange={e => setNewState(e.target.value)} placeholder="e.g. Haryana" className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">City (Optional)</label>
                  <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Leave blank for whole state" className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                  <select required value={newDepartment} onChange={e => setNewDepartment(e.target.value)} className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900">
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
                  <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Assign a custom password" className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-sm mt-4">
                Create Admin Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-lg p-8 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create Employee</h2>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Assign Under Admin</label>
                <select required value={selectedAdminEmail} onChange={e => setSelectedAdminEmail(e.target.value)} className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900">
                    <option value="">Select an Admin...</option>
                    {admins.map(a => (
                        <option key={a.email} value={a.email}>{a.name} ({a.department || "All"}) - {a.city ? `${a.city}, ` : ''}{a.state}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">The employee will automatically inherit the jurisdiction and department of the selected admin.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Employee Name</label>
                <input required type="text" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Login Email</label>
                <input required type="email" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Initial Password</label>
                <input required type="text" value={newEmpPassword} onChange={e => setNewEmpPassword(e.target.value)} placeholder="Assign a custom password" className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 text-slate-900" />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-sm mt-4">
                Create Employee Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-sm p-8 shadow-2xl animate-fade-in-up">
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
                  className="w-full bg-slate-50 border border-emerald-100 rounded-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-sm transition-colors">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Area Adoptions Tab */}
      {activeTab === "area_adoptions" && (
        <div className="bg-white border border-emerald-200 rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-emerald-100 bg-emerald-50 flex justify-between items-center">
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">State-Level Administrators (Global Adoptions)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-emerald-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
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
                  <tr key={admin.email} className="border-b border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{admin.name}</div>
                      <div className="text-slate-500 text-xs">{admin.email}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{admin.state}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded">ALL CITIES & DEPTS</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      )}      {/* Add Organization Modal */}
      {isAddOrgModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-surface-100 flex justify-between items-center z-10">
              <h2 className="text-xl font-black text-surface-900">Add Organization</h2>
              <button onClick={() => setIsAddOrgModalOpen(false)} className="text-surface-400 hover:text-surface-600 bg-surface-50 hover:bg-surface-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddOrganization} className="p-6 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-sm mb-4 text-sm text-indigo-800">
                <p>Organizations added here will be automatically marked as <strong>VERIFIED</strong>.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Organization Name</label>
                  <input required value={addOrgName} onChange={e=>setAddOrgName(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" placeholder="e.g. Green Earth NGO" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Email</label>
                  <input required type="email" value={addOrgEmail} onChange={e=>setAddOrgEmail(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Type</label>
                  <select required value={addOrgType} onChange={e=>setAddOrgType(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm">
                    <option value="NGO">NGO</option>
                    <option value="NSS">NSS</option>
                    <option value="NCC">NCC</option>
                    <option value="Youth Club">Youth Club</option>
                    <option value="RWA">RWA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Description</label>
                  <textarea required rows={2} value={addOrgDescription} onChange={e=>setAddOrgDescription(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">State</label>
                  <input required value={addOrgState} onChange={e=>setAddOrgState(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">City</label>
                  <input required value={addOrgCity} onChange={e=>setAddOrgCity(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Address</label>
                  <input required value={addOrgAddress} onChange={e=>setAddOrgAddress(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Contact Person Name</label>
                  <input required value={addOrgContactPerson} onChange={e=>setAddOrgContactPerson(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-600 mb-1">Phone</label>
                  <input required value={addOrgPhone} onChange={e=>setAddOrgPhone(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-surface-600 mb-1">Initial Password</label>
                  <input required type="text" value={addOrgPassword} onChange={e=>setAddOrgPassword(e.target.value)} className="w-full border p-2.5 rounded-sm text-sm" placeholder="Set a secure password" />
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddOrgModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-surface-600 hover:bg-surface-100 rounded-sm transition-colors">Cancel</button>
                <button type="submit" disabled={addOrgSubmitting} className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm transition-colors flex items-center gap-2">
                  {addOrgSubmitting ? "Creating..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
