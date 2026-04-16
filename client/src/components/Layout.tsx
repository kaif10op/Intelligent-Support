import React, { useState } from 'react';
import Navbar from './Navbar.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden page-enter">
      {/* Absolute floating background gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Subtle top shadow when scrolling down would go here */}
          
          {/* Breadcrumb Bar */}
          <div className="hidden border-b z-10 sm:block px-6 py-2.5 bg-background/80 backdrop-blur-md sticky top-0" style={{ borderColor: 'var(--glass-border)' }}>
            <Breadcrumb />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="w-full h-full pb-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
