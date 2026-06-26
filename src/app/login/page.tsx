"use client";

import { SignIn } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ShieldAlert, KeyRound } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { setDevBypass } = useAuth();
  const router = useRouter();

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [error, setError] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
        // Use the secure server-side login endpoint — password never exposed to client
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: staffEmail.trim(), password: staffPassword })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Login failed. Please try again.");
          return;
        }

        const user = data.user;
        setDevBypass(staffEmail.trim());
        setTimeout(() => {
          if (user.role === "super_admin") router.push("/super-admin");
          else if (user.role === "admin") router.push("/admin");
          else if (user.role === "employee") router.push("/employee");
          else if (user.role === "volunteer_org") router.push("/volunteer-org/dashboard");
          else router.push("/");
        }, 100);
    } catch (err) {
        console.error(err);
        setError("Failed to connect to authentication server.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Premium White/Blue Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px]" />

      <div className="z-10 shadow-2xl rounded-2xl overflow-hidden mb-8">
        <SignIn routing="hash" />
      </div>

      <div className="z-10 w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-lg animate-fade-in-up">
        <h3 className="text-slate-800 font-bold mb-2 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            Staff Login
        </h3>
        <p className="text-xs text-slate-500 mb-6">
            Admins and Employees: Login with your custom credentials provided by your manager.
        </p>

        <form onSubmit={handleStaffLogin} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> {error}
                </div>
            )}
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input 
                    type="email" 
                    required 
                    value={staffEmail} 
                    onChange={e => setStaffEmail(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="worker@demo.com"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input 
                    type="password" 
                    required 
                    value={staffPassword} 
                    onChange={e => setStaffPassword(e.target.value)} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="••••••••"
                />
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl transition-colors">
                Sign In to Dashboard
            </button>
        </form>
      </div>
    </div>
  );
}
