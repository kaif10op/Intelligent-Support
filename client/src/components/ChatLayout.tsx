import React, { useState } from 'react';
import Navbar from './Navbar.tsx';
import Sidebar from './Sidebar.tsx';

const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden page-enter">
      {/* Absolute floating background gradients reduced for chat focus */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Page Content - Full height for chat */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;
