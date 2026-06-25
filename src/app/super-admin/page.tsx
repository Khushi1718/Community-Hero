"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Plus, X, Users, MapPin, LogOut, UserCog, UserCircle } from "lucide-react";
import { AppUser } from "@/lib/storage";

export default function SuperAdminPage() {
  const { user, appUser, role, loading, logoutMock } = useAuth();
  const router = useRouter();
  
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [employees, setEmployees] = useState<AppUser[]>([]);
  
  const [activeTab, setActiveTab] = useState<"admins" | "employees">("admins");
  
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
      const res = await fetch("/api/users");
      const allUsers = await res.json();
      setAdmins(allUsers.filter((u: any) => u.role === "admin"));
      setEmployees(allUsers.filter((u: any) => u.role === "employee"));
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
        <div className="flex gap-4 mb-6">
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
    </div>
  );
}
