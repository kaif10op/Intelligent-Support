import { useEffect, useState } from 'react';
import { Home, MessageSquare, Database, Settings, HelpCircle, Clock, Ticket, Search as SearchIcon, ChevronRight, BarChart3, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

const Sidebar = () => {
  const { user } = useAuthStore();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const role = (user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isSupport = isAdmin || ['SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes(role);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CHAT_LIST, axiosConfig);
        const chats = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setRecentChats(chats.slice(0, 5));
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      }
    };
    fetchRecent();
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
      isActive
        ? 'bg-primary/15 text-primary border border-primary/20'
        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-background/50 backdrop-blur-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 mb-2">Main</h3>

        {isAdmin ? (
          <>
            <NavLink to="/admin/dashboard" className={navItemClass}>
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              <span>Admin Dashboard</span>
            </NavLink>
            <NavLink to="/admin" className={navItemClass}>
              <Users className="w-5 h-5 flex-shrink-0" />
              <span>User Management</span>
            </NavLink>
            <NavLink to="/tickets" className={navItemClass}>
              <Ticket className="w-5 h-5 flex-shrink-0" />
              <span>Tickets</span>
            </NavLink>
            <NavLink to="/chats" className={navItemClass}>
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              <span>Chats</span>
            </NavLink>
            <NavLink to="/knowledge-bases" className={navItemClass}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <span>Knowledge Bases</span>
            </NavLink>
          </>
        ) : isSupport ? (
          <>
            <NavLink to="/support-queue" className={navItemClass}>
              <Ticket className="w-5 h-5 flex-shrink-0" />
              <span>Support Queue</span>
            </NavLink>
            <NavLink to="/tickets" className={navItemClass}>
              <Ticket className="w-5 h-5 flex-shrink-0" />
              <span>All Tickets</span>
            </NavLink>
            <NavLink to="/chats" className={navItemClass}>
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              <span>Recent Chats</span>
            </NavLink>
            <NavLink to="/knowledge-bases" className={navItemClass}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <span>Knowledge Bases</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={navItemClass}>
              <Home className="w-5 h-5 flex-shrink-0" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/chats" className={navItemClass}>
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              <span>Recent Chats</span>
            </NavLink>
            <NavLink to="/tickets" className={navItemClass}>
              <Ticket className="w-5 h-5 flex-shrink-0" />
              <span>My Tickets</span>
            </NavLink>
            <NavLink to="/knowledge-bases" className={navItemClass}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <span>Knowledge Bases</span>
            </NavLink>
          </>
        )}

        {isAdmin && (
          <NavLink to="/search" className={navItemClass}>
            <SearchIcon className="w-5 h-5 flex-shrink-0" />
            <span>Global Search</span>
          </NavLink>
        )}

        {/* Recently Active Section */}
        {recentChats.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/30">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 mb-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Recently Active
            </h3>

            <div className="space-y-1">
              {recentChats.map((chat: any) => (
                <NavLink
                  key={chat.id}
                  to={`/chat/${chat.id}?kbId=${chat.kbId}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors group ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                    }`
                  }
                  title={chat.title}
                >
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="truncate">{chat.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-border/30 space-y-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 mb-2">Settings</h3>

        <NavLink to="/settings" className={navItemClass}>
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span>Settings</span>
        </NavLink>

        <NavLink to="/help" className={navItemClass}>
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span>Help & Support</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
