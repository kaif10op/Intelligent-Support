import React from 'react';
import Navbar from './Navbar.tsx';
import Sidebar from './Sidebar.tsx';
import Breadcrumb from './Breadcrumb.tsx';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <main className="content-area">
          <Breadcrumb />
          {children}
        </main>
      </div>

      <style>{`
        .layout-container { display: flex; flex-direction: column; min-height: 100vh; }
        .main-content { display: flex; flex: 1; overflow: hidden; }
        .content-area { flex: 1; padding: 24px; overflow-y: auto; background: rgba(0,0,0,0.2); }
      `}</style>
    </div>
  );
};

export default Layout;
