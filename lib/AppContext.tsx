"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  activeNav: "dashboard",
  setActiveNav: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  darkMode: true,
  setDarkMode: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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

  return (
    <AppContext.Provider
      value={{
        activeNav,
        setActiveNav,
        sidebarCollapsed,
        setSidebarCollapsed,
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
