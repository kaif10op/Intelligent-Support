import { useEffect, useState } from 'react';
import { Home, MessageSquare, Database, Settings, HelpCircle, Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

const Sidebar = () => {
  const [recentChats, setRecentChats] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/chat');
        setRecentChats(res.data.slice(0, 5));
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      }
    };
    fetchRecent();
  }, []);

  return (
    <aside className="sidebar glass">
      <div className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/chats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Recent Chats</span>
        </NavLink>
        <NavLink to="/knowledge-bases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Database size={20} />
          <span>Knowledge Bases</span>
        </NavLink>

        <div className="recent-list-section">
           <div className="section-label">
              <Clock size={14} />
              <span>Recently Active</span>
           </div>
           <div className="recent-items">
              {recentChats.map(chat => (
                <NavLink key={chat.id} to={`/chat/${chat.id}?kbId=${chat.kbId}`} className="recent-item">
                  <div className="dot"></div>
                  <span>{chat.title}</span>
                </NavLink>
              ))}
              {recentChats.length === 0 && <span className="empty-hint">No recent chats</span>}
           </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <NavLink to="/help" className="nav-item">
          <HelpCircle size={20} />
          <span>Help</span>
        </NavLink>
      </div>

      <style>{`
        .sidebar { width: 280px; height: 100%; border-radius: 0; border-top: none; border-bottom: none; border-left: none; display: flex; flex-direction: column; padding: 24px 0; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 0 16px; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: var(--text-muted); text-decoration: none; transition: var(--transition-smooth); font-weight: 500; }
        .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
        .nav-item.active { background: rgba(138, 43, 226, 0.15); color: var(--accent-primary); border: 1px solid rgba(138, 43, 226, 0.3); }
        .recent-list-section { margin-top: 32px; padding: 0 16px; }
        .section-label { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .recent-items { display: flex; flex-direction: column; gap: 4px; }
        .recent-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .recent-item:hover { background: rgba(255,255,255,0.03); color: #fff; }
        .dot { width: 6px; height: 6px; background: var(--accent-primary); border-radius: 50%; flex-shrink: 0; }
        .empty-hint { font-size: 0.8rem; color: var(--text-muted); padding: 0 12px; font-style: italic; }
        .sidebar-footer { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--glass-border); padding-top: 24px; }
      `}</style>
    </aside>
  );
};


export default Sidebar;
