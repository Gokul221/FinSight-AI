"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

// Type definition for the application context
interface AppContextType {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  user: CurrentUser | null;
  userLoading: boolean;
  setUser: (user: CurrentUser | null) => void;
  logout: () => Promise<void>;
}

// Create the application context with default values
const AppContext = createContext<AppContextType>({
  activeNav: "dashboard",
  setActiveNav: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  darkMode: true,
  setDarkMode: () => {},
  user: null, // if
  userLoading: true,
  setUser: () => {},
  logout: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [darkMode]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <AppContext.Provider
      value={{
        activeNav,
        setActiveNav,
        sidebarCollapsed,
        setSidebarCollapsed,
        darkMode,
        setDarkMode,
        user,
        userLoading,
        setUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
