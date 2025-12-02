import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user settings to get theme preference
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery();
  
  // Update theme when settings load
  useEffect(() => {
    if (settings?.theme) {
      setThemeState(settings.theme as Theme);
    }
    if (!settingsLoading) {
      setIsLoading(false);
    }
  }, [settings, settingsLoading]);
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
    }
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
