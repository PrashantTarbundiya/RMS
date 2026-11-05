import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {}
});

/**
 * Enterprise Permanent Monochrome Dark Mode Provider
 * Light mode has been permanently removed across AuraPass.
 */
export function ThemeProvider({ children }) {
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('aurapass_theme', 'dark');
    } catch {
      // Fallback
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true, toggleTheme: () => {}, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
