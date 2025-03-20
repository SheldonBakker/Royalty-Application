import React from 'react';
import { useTheme } from '../hooks/useTheme';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <main className="flex-grow">
        {children}
      </main>
      <Footer variant="simple" />
    </div>
  );
}

export default AppLayout; 