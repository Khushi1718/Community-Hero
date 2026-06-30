"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { Shield, Home, MapPin, FileText, Users, User, LogOut, Bell, X, Check, Globe } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/lib/i18n-provider";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  issueId?: string;
  createdAt: string;
}

export function Navbar() {
  const { user, appUser, role, loading, logoutMock } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const userEmail = user?.email || appUser?.email;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userEmail)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data.slice(0, 10));
    } catch { /* silent */ }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    fetchNotifications();
    // Poll every 30 seconds
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications, userEmail]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (notifId: string) => {
    try {
      await fetch(`/api/notifications/${notifId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRead: true }) });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.allSettled(unread.map(n => markAsRead(n._id)));
  };

  const handleCTA = () => {
    if (!user && !appUser) { router.push("/login"); return; }
    if (role === "citizen") router.push("/report");
    else if (role === "super_admin") router.push("/super-admin");
    else if (role === "admin") router.push("/admin");
    else if (role === "employee") router.push("/employee");
  };

  const navItems = [
    { name: t("navbar.home"), path: "/", icon: Home },
    ...(role === "citizen" ? [
      { name: t("navbar.report"), path: "/report", icon: MapPin },
      { name: t("navbar.myReports"), path: "/my-reports", icon: FileText },
    ] : []),
    { name: t("navbar.community"), path: "/community", icon: Users },
    ...(role === "citizen" ? [
      { name: t("navbar.profile"), path: "/profile", icon: User },
    ] : []),
  ];

  const isLoggedIn = !!(user || appUser);

  return (
    <nav className="w-full glass-panel sticky top-0 z-[999] border-b border-surface-200/50 animate-fade-in bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <img src="/images/logo.png" alt="Community Hero Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-slate-800 tracking-tight hidden sm:block">{t("common.title")}</span>
        </div>

        {/* Center Nav */}
        <div className="flex-1 flex justify-center px-4 hidden md:flex">
          <div className="flex gap-6 items-center">
            {navItems.map(item => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`flex flex-col items-center justify-center pt-1 text-sm font-bold transition-all ${
                    isActive
                      ? "text-green-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5 pb-1">
                     <item.icon className="w-4 h-4 hidden lg:block" />
                     {item.name}
                  </div>
                  {/* Active underline */}
                  <div className={`h-0.5 w-full rounded-t-full transition-colors ${isActive ? 'bg-green-600' : 'bg-transparent'}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex gap-3 items-center">
          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl h-9 border border-slate-200"
              aria-label="Change Language"
              aria-expanded={showLangDropdown}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
              <span>{locale === "en" ? "English" : "हिन्दी"}</span>
              <span className="text-[9px] opacity-70">▼</span>
            </button>
            {showLangDropdown && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-fade-in">
                <div className="py-1">
                  <button
                    onClick={() => { setLocale("en"); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      locale === "en" ? "bg-green-50 text-green-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLocale("hi"); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      locale === "hi" ? "bg-green-50 text-green-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            /* Show login buttons while auth resolves — looks correct for all visitors */
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {t("navbar.login")}
              </button>
              <button
                onClick={() => router.push("/report")}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                {t("navbar.reportAnIssue")}
              </button>
            </div>
          ) : isLoggedIn ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setShowNotifDropdown(!showNotifDropdown); if (!showNotifDropdown) fetchNotifications(); }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">{t("navbar.notifications")}</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                            <Check className="w-3 h-3" />{t("navbar.markAllRead")}
                          </button>
                        )}
                        <button onClick={() => setShowNotifDropdown(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">{t("navbar.noNotifications")}</p>
                        </div>
                      ) : notifications.map(notif => (
                        <div
                          key={notif._id}
                          onClick={() => { markAsRead(notif._id); if (notif.issueId && role === "citizen") router.push(`/my-reports/${notif.issueId}`); setShowNotifDropdown(false); }}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? "bg-blue-50/50 border-l-2 border-l-blue-500" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{notif.title}</p>
                              <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-slate-400 text-[10px] mt-1">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard link */}
              {(role === "super_admin" || role === "admin" || role === "employee") && (
                <button onClick={handleCTA} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors hidden sm:block">
                  {t("navbar.dashboard")}
                </button>
              )}

              {/* Staff sign out */}
              {appUser && (
                <button
                  onClick={() => { logoutMock(); router.push("/"); }}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t("navbar.logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
              
              {/* Clerk User Button */}
              {user && <UserButton />}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {t("navbar.login")}
              </button>
              <button 
                onClick={() => router.push("/report")}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                {t("navbar.reportAnIssue")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
