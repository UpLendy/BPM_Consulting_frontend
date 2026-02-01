'use client';

import { ReactNode, useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Sidebar from '@/app/components/Sidebar';
import { authService } from '@/app/services/authService';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Initialize state from localStorage if available, default to true
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    // Check auth
    if (!authService.isAuthenticated()) {
        window.location.href = '/login';
    }
    
    // Check if we are on mobile to decide default state
    const isMobile = window.innerWidth < 1024;
    
    // Restore sidebar state if not mobile
    const storedState = localStorage.getItem('sidebarOpen');
    if (storedState !== null && !isMobile) {
      setIsSidebarOpen(storedState === 'true');
    } else if (isMobile) {
      setIsSidebarOpen(false); // Always start closed on mobile
    }
    
    // Enable transitions after initial render and state restoration
    setTimeout(() => {
        setIsMounting(false);
    }, 100);
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar} 
        transitionEnabled={!isMounting}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
