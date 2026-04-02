import React from 'react';
import Navbar from './Navbar.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          <div className="border-b border-border/50 px-6 py-3 bg-background/50 backdrop-blur-sm">
            <Breadcrumb />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
