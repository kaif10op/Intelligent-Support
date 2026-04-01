import { useAuthStore } from '../store/useAuthStore.js';
import { LogOut, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="navbar glass">
      <div className="brand">
        <Link to="/"><h1>AI SUPPORT</h1></Link>
      </div>

      <div className="nav-actions">
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="admin-link">
            <Shield size={20} />
            Admin
          </Link>
        )}
        
        <div className="user-profile">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="avatar" />
          ) : (
            <User size={24} />
          )}
          <span>{user?.name}</span>
        </div>

        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
        </button>
      </div>

      <style>{`
        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-radius: 0; border-top: none; border-left: none; border-right: none; z-index: 100; }
        .brand h1 { font-size: 1.5rem; letter-spacing: 2px; }
        .nav-actions { display: flex; align-items: center; gap: 24px; }
        .user-profile { display: flex; align-items: center; gap: 12px; font-weight: 500; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--accent-primary); }
        .logout-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; transition: var(--transition-smooth); }
        .logout-btn:hover { color: #ff4b4b; }
        .admin-link { display: flex; align-items: center; gap: 8px; color: var(--accent-secondary); text-decoration: none; font-weight: 600; padding: 6px 12px; background: rgba(0, 210, 255, 0.1); border-radius: 6px; transition: var(--transition-smooth); }
        .admin-link:hover { background: rgba(0, 210, 255, 0.2); }
      `}</style>
    </nav>
  );
};

export default Navbar;
