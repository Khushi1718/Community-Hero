"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AppUser, UserRole } from "./storage";

type Role = UserRole | null;

interface AuthContextType {
  user: any | null;
  appUser: AppUser | null;
  role: Role;
  loading: boolean;
  logoutMock: () => void;
  setDevBypass: (email: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  role: null,
  loading: true,
  logoutMock: () => {},
  setDevBypass: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [devBypassEmail, setDevBypassEmail] = useState<string | null>(null);

  const [isLoadingDBUser, setIsLoadingDBUser] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDevBypassEmail(localStorage.getItem("dev_bypass_email"));
      // Ensure superadmin exists — only creates if not already in DB (safe upsert handled server-side)
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "superadmin@google.com",
          name: "Super Admin",
          role: "super_admin",
          password: "password123"
        })
      }).catch(err => console.error("Failed to seed super admin", err));
    }
  }, []);

  useEffect(() => {
    const loadUserFromDB = async (email: string, fallbackName: string) => {
      setIsLoadingDBUser(true);
      try {
        // Always lookup by lowercase email for consistency
        const normalizedEmail = email.toLowerCase().trim();
        const res = await fetch(`/api/users?email=${encodeURIComponent(normalizedEmail)}`);
        const users = await res.json();
        
        if (users && users.length > 0) {
          const foundUser = users[0];
          setAppUser(foundUser);
          setRole(foundUser.role);
        } else {
          // User not found in DB — only create as citizen if this is a Clerk user (not a staff bypass)
          // Staff logins MUST have been created by admin first
          if (!devBypassEmail) {
            // This is a Clerk citizen login — safe to create
            const newCitizen = { email: normalizedEmail, name: fallbackName, role: "citizen" };
            await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newCitizen)
            });
            setAppUser(newCitizen as any);
            setRole("citizen");
          } else {
            // Staff bypass but user not found — their account wasn't created yet
            console.error(`Staff login failed: no account found for ${normalizedEmail}`);
            // Clear the bypass so they don't get stuck in a loop
            localStorage.removeItem("dev_bypass_email");
            setDevBypassEmail(null);
            setRole(null);
            setAppUser(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user from DB:", err);
      } finally {
        setIsLoadingDBUser(false);
      }
    };

    if (devBypassEmail) {
      loadUserFromDB(devBypassEmail, "Dev User");
      return;
    }

    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        loadUserFromDB(email, user.fullName || "Citizen");
      }
    } else if (isLoaded && !user) {
      setRole(null);
      setAppUser(null);
    }
  }, [user, isLoaded, devBypassEmail]);

  const logoutMock = async () => {
    if (devBypassEmail) {
      localStorage.removeItem("dev_bypass_email");
      setDevBypassEmail(null);
      setRole(null);
      setAppUser(null);
      window.location.href = "/login";
      return;
    }
    await signOut();
    router.push("/login");
  };

  const setDevBypass = (email: string) => {
    localStorage.setItem("dev_bypass_email", email);
    setDevBypassEmail(email);
  };

  const computedUser = devBypassEmail 
    ? { email: devBypassEmail, uid: "dev_" + devBypassEmail, fullName: "Dev User" }
    : user ? { email: user.primaryEmailAddress?.emailAddress, uid: user.id, ...user } : null;

  const computedLoading = (devBypassEmail ? false : !isLoaded) || isLoadingDBUser;

  return (
    <AuthContext.Provider value={{ 
      user: computedUser, 
      appUser,
      role, 
      loading: computedLoading, 
      logoutMock,
      setDevBypass
    }}>
      {children}
    </AuthContext.Provider>
  );
};
