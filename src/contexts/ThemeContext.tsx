import { createContext } from 'react';

export type ThemeContextType = {
  darkMode: boolean;
  toggleTheme: () => void;
  // ... any other theme-related properties
};

// Create and export the context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined); 