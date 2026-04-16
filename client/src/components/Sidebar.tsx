import { useEffect, useState } from 'react';
import { Home, MessageSquare, Database, Settings, HelpCircle, Clock, Ticket, Search as SearchIcon, ChevronRight, BarChart3, Users, ChevronLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

interface RecentChat {
  id: string;
  kbId?: string;
  title?: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ collapsed = false, onToggle }: SidebarProps) => {
  const { user } = useAuthStore();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const role = (user?.role || '').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isSupport = isAdmin || ['SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes(role);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setRecentLoading(true);
        const res = await axios.get(API_ENDPOINTS.CHAT_LIST, axiosConfig);
        const chats = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setRecentChats((Array.isArray(chats) ? chats : []).slice(0, 5));
      } catch (err) {
        console.error('Sidebar fetch error:', err);
      } finally {
        setRecentLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const mainLinks = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Admin Dashboard', icon: BarChart3 },
        { to: '/admin', label: 'User Management', icon: Users },
        { to: '/tickets', label: 'Tickets', icon: Ticket },
        { to: '/chats', label: 'Chats', icon: MessageSquare },
        { to: '/knowledge-bases', label: 'Knowledge Bases', icon: Database },
        { to: '/search', label: 'Global Search', icon: SearchIcon }
      ]
    : isSupport
    ? [
        { to: '/support-queue', label: 'Support Queue', icon: Ticket },
        { to: '/tickets', label: 'All Tickets', icon: Ticket },
        { to: '/chats', label: 'Recent Chats', icon: MessageSquare },
        { to: '/knowledge-bases', label: 'Knowledge Bases', icon: Database }
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: Home },
        { to: '/chats', label: 'Recent Chats', icon: MessageSquare },
        { to: '/tickets', label: 'My Tickets', icon: Ticket },
        { to: '/knowledge-bases', label: 'Knowledge Bases', icon: Database }
      ];

  const roleBadge = isAdmin ? 'Admin' : isSupport ? 'Support' : 'Customer';
  const roleColor = isAdmin ? 'text-primary-400' : isSupport ? 'text-amber-400' : 'text-emerald-400';
  const roleBg = isAdmin ? 'bg-primary-500/10' : isSupport ? 'bg-amber-500/10' : 'bg-emerald-500/10';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'sidebar-active-indicator bg-primary-500/10 text-primary-500'
        : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800'
    } ${collapsed ? 'justify-center px-2' : ''}`;

  return (
    <aside
      className={`sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto border-r bg-background/60 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      style={{ borderColor: 'var(--glass-border)' }}
    >
      {/* Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-surface-400 shadow-sm transition-all duration-200 hover:text-primary-500 hover:border-primary-500/30"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-5 p-3">
        {/* Workspace Badge */}
        {!collapsed && (
          <div className="rounded-xl p-3" style={{ background: 'var(--gradient-subtle)' }}>
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${roleBg}`}>
                <span className={`text-xs font-bold ${roleColor}`}>
                  {roleBadge.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{user?.name || 'User'}</p>
                <p className={`text-[10px] font-medium ${roleColor}`}>{roleBadge} workspace</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-surface-400">
              Navigation
            </p>
          )}
          {mainLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={navItemClass} title={collapsed ? item.label : undefined}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Recent Activity */}
        {!collapsed && (
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-surface-400">
              <Clock className="h-3 w-3" />
              Recent Activity
            </h3>

            {recentLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-8 animate-pulse rounded-lg bg-surface-100" />
                ))}
              </div>
            ) : recentChats.length === 0 ? (
              <p className="py-2 text-xs text-surface-400">No recent chats yet.</p>
            ) : (
              <div className="space-y-0.5">
                {recentChats.slice(0, 4).map((chat) => (
                  <NavLink
                    key={chat.id}
                    to={`/chat/${chat.id}${chat.kbId ? `?kbId=${chat.kbId}` : ''}`}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-500/10 text-primary-500'
                          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800'
                      }`
                    }
                    title={chat.title || 'Untitled Chat'}
                  >
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400"></div>
                    <span className="truncate text-xs">{chat.title || 'Untitled Chat'}</span>
                    <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer Navigation */}
      <div className="space-y-0.5 border-t p-3" style={{ borderColor: 'var(--glass-border)' }}>
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-surface-400">
            Tools
          </p>
        )}

        <NavLink to="/settings" className={navItemClass} title={collapsed ? 'Settings' : undefined}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors">
            <Settings className="h-[18px] w-[18px]" />
          </div>
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <NavLink to="/help" className={navItemClass} title={collapsed ? 'Help & Support' : undefined}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors">
            <HelpCircle className="h-[18px] w-[18px]" />
          </div>
          {!collapsed && <span>Help & Support</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
