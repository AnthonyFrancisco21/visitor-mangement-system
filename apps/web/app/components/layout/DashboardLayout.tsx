'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'RECEPTIONIST';
  userName?: string;
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.wrapper}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
        role={role} 
        userName={userName}
      />
      
      <div className={styles.main}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={toggleSidebar}>
            ☰
          </button>
          
          <div className={styles.mobileLogo}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-3.5 h-3.5 bg-white rounded-md" />
            </div>
            <span className={styles.mobileLogoText}>VisitorPass</span>
          </div>
          
          <div className="w-10" /> {/* Spacer for balance */}
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
