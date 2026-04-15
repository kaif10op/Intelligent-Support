import { useEffect, useState } from 'react';
import { Home, MessageSquare, Database, Settings, HelpCircle, Clock, Ticket, Search as SearchIcon, ChevronRight, BarChart3, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';
interface RecentChat {
  id: string;
  kbId?: string;
  title?: string;
}

const Sidebar = () => {
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

  const roleBadge = isAdmin ? 'Admin workspace' : isSupport ? 'Support workspace' : 'Customer workspace';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
      isActive
        ? 'border border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/10'
        : 'border border-transparent text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground'
    }`;

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 overflow-y-auto border-r border-border/60 bg-background/65 backdrop-blur-md lg:flex lg:flex-col">
      {/* Main Navigation */}
      <nav className="flex-1 space-y-6 p-4">
        <div className="rounded-2xl border border-border bg-card/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Navigation</p>
          <p className="mt-1 text-xs text-muted-foreground">{roleBadge}</p>
        </div>

        <div className="space-y-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={navItemClass}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-muted-foreground transition-colors group-hover:text-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-3">
          <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Recent activity
          </h3>

          {recentLoading ? (
            <div className="space-y-2 px-1 py-1">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-8 animate-pulse rounded-lg bg-surface-100" />
              ))}
            </div>
          ) : recentChats.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">No recent chats yet.</p>
          ) : (
            <div className="space-y-1">
              {recentChats.slice(0, 4).map((chat) => (
                <NavLink
                  key={chat.id}
                  to={`/chat/${chat.id}${chat.kbId ? `?kbId=${chat.kbId}` : ''}`}
                  className={({ isActive }) =>
                    `group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'
                    }`
                  }
                  title={chat.title || 'Untitled Chat'}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                  <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer Navigation */}
      <div className="space-y-1 border-t border-border/50 p-4">
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace tools</h3>

        <NavLink to="/settings" className={navItemClass}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-muted-foreground transition-colors group-hover:text-foreground">
            <Settings className="h-4.5 w-4.5" />
          </div>
          <span>Settings</span>
        </NavLink>

        <NavLink to="/help" className={navItemClass}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-muted-foreground transition-colors group-hover:text-foreground">
            <HelpCircle className="h-4.5 w-4.5" />
          </div>
          <span>Help & Support</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
