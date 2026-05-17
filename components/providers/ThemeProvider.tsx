"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { BloomTheme } from "@/types";

const ThemeContext = createContext<BloomTheme>("cozy");

export function useBloomTheme() {
  return useContext(ThemeContext);
}

interface Props {
  theme: BloomTheme;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: Props) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
