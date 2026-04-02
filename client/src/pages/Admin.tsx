import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Database, Shield, Zap, TrendingUp, Search, Filter, BarChart as BarIcon, PieChart as PieIcon, Activity, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, axiosConfig } from '../config/api';

const Admin = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, chatsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.ADMIN_STATS, axiosConfig),
        axios.get(API_ENDPOINTS.ADMIN_USERS, axiosConfig),
        axios.get(API_ENDPOINTS.ADMIN_CHATS, axiosConfig).catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      const chatsData = Array.isArray(chatsRes.data) ? chatsRes.data : chatsRes.data.chats || [];
      setChats(Array.isArray(chatsData) ? chatsData : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateTicket = async (ticketId: string, status: string) => {
    try {
      await axios.put(API_ENDPOINTS.TICKET_UPDATE(ticketId), { status }, axiosConfig);
      fetchAdminData();
    } catch (err) {
      console.error('Update ticket error:', err);
    }
  };

  const COLORS = ['#ec4899', '#3b82f6', '#06b6d4', '#ef4444', '#f59e0b'];

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter(c =>
    (c.title?.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
      c.kb?.title?.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
      c.user?.name?.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(chatSearchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading admin analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Admin Command Center</h1>
        </div>
        <p className="text-muted-foreground">Global platform overview and user management.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="glass-elevated border border-border/50 rounded-xl p-8 flex items-center gap-6 group relative">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Total Users</p>
            <p className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-500 absolute top-4 right-4 opacity-60" />
        </div>

        {/* Knowledge Bases */}
        <div className="glass-elevated border border-border/50 rounded-xl p-8 flex items-center gap-6 group relative">
          <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            <Database className="w-7 h-7 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Knowledge Bases</p>
            <p className="text-3xl font-bold text-foreground">{stats?.totalKBs || 0}</p>
          </div>
          <Zap className="w-5 h-5 text-destructive absolute top-4 right-4 opacity-60" />
        </div>

        {/* Total Tickets */}
        <div className="glass-elevated border border-border/50 rounded-xl p-8 flex items-center gap-6 group relative">
          <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <Zap className="w-7 h-7 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-foreground">{stats?.totalTickets || 0}</p>
          </div>
          <Activity className="w-5 h-5 text-primary absolute top-4 right-4 opacity-60" />
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Confidence Distribution */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BarIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">AI Confidence Distribution</h3>
          </div>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.confidenceDist || []}>
                <XAxis dataKey="name" stroke="#a0aec0" fontSize={12} />
                <YAxis stroke="#a0aec0" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats?.confidenceDist?.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Feedback Quality */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <PieIcon className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">User Feedback Quality</h3>
          </div>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.feedbackStats || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.feedbackStats?.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Management */}
      <section className="glass-elevated border border-border/50 rounded-xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <div className="glass border border-border/30 rounded-lg flex items-center gap-3 px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm placeholder-muted-foreground text-foreground outline-none flex-1"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">KBs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-border/10 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img src={user.picture} alt="" className="w-9 h-9 rounded-full border border-border/30" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-card/50 flex items-center justify-center">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      user.role === 'ADMIN'
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-muted/10 text-muted-foreground'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-sm text-foreground font-medium">{user._count?.knowledgeBases || 0}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-sm text-emerald-400 font-medium">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </div>
      </section>

      {/* Ticket Management */}
      <section className="glass-elevated border border-border/50 rounded-xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Ticket Management</h2>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Filter className="w-4 h-4" />
            <span>Recent Tickets</span>
          </div>
        </div>

        <div className="space-y-3">
          {stats?.tickets && stats.tickets.length > 0 ? (
            stats.tickets.map((ticket: any) => (
              <div key={ticket.id} className="glass-elevated border border-border/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Priority Badge */}
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${
                    ticket.priority === 'URGENT' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    ticket.priority === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {ticket.priority}
                  </span>

                  {/* Ticket Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground truncate">{ticket.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">from <span className="font-medium">{ticket.user?.email}</span></p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    ticket.status === 'OPEN' ? 'bg-red-500/10 text-red-400' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {ticket.status}
                  </span>

                  {ticket.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateTicket(ticket.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors"
                    >
                      Handle
                    </button>
                  )}
                  {ticket.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateTicket(ticket.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No active tickets to manage.</p>
            </div>
          )}
        </div>
      </section>

      {/* Chat Management */}
      <section className="glass-elevated border border-border/50 rounded-xl p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">Chat Management</h2>
          <div className="glass border border-border/30 rounded-lg flex items-center gap-3 px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search chats by title, user, or KB..."
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              className="bg-transparent text-sm placeholder-muted-foreground text-foreground outline-none flex-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredChats.length > 0 ? (
            filteredChats.slice(0, 10).map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}?kbId=${chat.kbId}`}
                className="glass-elevated border border-border/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground truncate">{chat.title || 'Untitled Chat'}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="truncate">User: {chat.user?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span className="truncate">KB: {chat.kb?.title || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{chat.messages?.length || 0} messages</span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">View</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {chats.length === 0 ? 'No active chats' : 'No chats match your search'}
              </p>
            </div>
          )}
          {filteredChats.length > 10 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">Showing 10 of {filteredChats.length} chats</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Admin;
