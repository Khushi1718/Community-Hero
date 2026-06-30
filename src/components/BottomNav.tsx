"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Home, MapPin, FileText, Users, User, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

export function BottomNav() {
  const { user, appUser, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) return null;

  const isLoggedIn = !!(user || appUser);
  if (!isLoggedIn) return null;

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    ...(role === "citizen" ? [
      { name: "Report", path: "/report", icon: MapPin },
      { name: "My Reports", path: "/my-reports", icon: FileText },
    ] : []),
    ...(role && role !== "citizen" ? [
      { 
        name: "Dashboard", 
        path: role === "volunteer_org" ? "/volunteer-org/dashboard" : role === "super_admin" ? "/super-admin" : `/${role}`, 
        icon: LayoutDashboard 
      },
    ] : []),
    { name: "Community", path: "/community", icon: Users },
    ...(role === "citizen" ? [
      { name: "Profile", path: "/profile", icon: User },
    ] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-x-0 border-b-0 flex justify-around p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] z-50">
      {navItems.map(item => {
        const isActive = pathname === item.path || (pathname?.startsWith(item.path) && item.path !== "/");
        return (
          <button
            key={item.name}
            onClick={() => {
              if (window.navigator.vibrate) window.navigator.vibrate(50); // Haptic feedback
              router.push(item.path);
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive 
                ? "text-primary-600" 
                : "text-surface-500 hover:text-surface-900"
            }`}
          >
            <div className={`relative p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-transparent text-surface-500'}`}>
              <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
            </div>
            <span className={`mt-1 transition-all ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}
