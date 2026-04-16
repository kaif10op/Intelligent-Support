import { useCallback, useEffect, useState } from 'react';
import { Users, Database, Shield, Zap, BarChart as BarIcon, Activity, Loader2, MessageSquare, Edit2, User, TrendingUp, ArrowUpRight, Filter, Download, RefreshCw, Lock, Plus, Check, Info, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import axiosInstance, { API_ENDPOINTS } from '../config/api';
import UserManagement from '../components/UserManagement';
import { Button, Card, Input, Modal, StatCard, NavigationTabs, Badge, Section } from '../components/ui';
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../services/cacheService';

type AdminTab = 'overview' | 'users' | 'activity' | 'assignment';

const Admin = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'support' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN' | 'SUPPORT_AGENT'>('USER');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Assignment state
  const [assignmentMetrics, setAssignmentMetrics] = useState<any>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fetchAdminData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setRefreshing(true);

      // Load from cache first for initial load
      if (isInitial) {
        const cachedStats = cacheService.get(CACHE_KEYS.ADMIN_STATS);
        const cachedUsers = cacheService.get(CACHE_KEYS.ADMIN_USERS);

        if (cachedStats) {
          setStats(cachedStats);
        }
        if (cachedUsers && Array.isArray(cachedUsers)) {
          setUsers(cachedUsers);
        }
      }

      // Fetch fresh data
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.ADMIN_STATS),
        axiosInstance.get(API_ENDPOINTS.ADMIN_USERS)
      ]);

      setStats(statsRes.data);
      cacheService.set(CACHE_KEYS.ADMIN_STATS, statsRes.data, CACHE_TTL.MEDIUM);

      const usersData = usersRes.data.users || [];
      setUsers(usersData);
      cacheService.set(CACHE_KEYS.ADMIN_USERS, usersData, CACHE_TTL.MEDIUM);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      addToast('Failed to load admin data', 'error');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAdminData(true);
  }, [fetchAdminData]);

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    try {
      setUpdatingRole(true);
      console.log('Updating role:', { userId: selectedUser.id, newRole });

      const response = await axiosInstance.put(
        `${API_ENDPOINTS.ADMIN_USERS}/${selectedUser.id}/role`,
        { role: newRole }
      );

      console.log('Role update response:', response.data);

      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      cacheService.delete(CACHE_KEYS.ADMIN_USERS); // Invalidate cache
      setShowRoleModal(false);
      setSelectedUser(null);
      addToast(`User role updated to ${newRole}`, 'success');
    } catch (err: any) {
      console.error('Error updating role:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update user role';
      addToast(errorMessage, 'error');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  // Fetch assignment metrics
  const fetchAssignmentMetrics = useCallback(async () => {
    try {
      setAssignmentLoading(true);
      const response = await axiosInstance.get(
        'http://localhost:8000/api/tickets/admin/assignment-metrics'
      );
      setAssignmentMetrics(response.data);
    } catch (err: any) {
      console.error('Error fetching assignment metrics:', err);
      addToast('Failed to load assignment metrics', 'error');
    } finally {
      setAssignmentLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === 'assignment') {
      fetchAssignmentMetrics();
    }
  }, [activeTab, fetchAssignmentMetrics]);

  // Auto-assign tickets
  const handleAutoAssign = async () => {
    try {
      setAutoAssigning(true);
      const response = await axiosInstance.post(
        'http://localhost:8000/api/tickets/admin/auto-assign'
      );
      addToast(response.data.message, 'success');
      await fetchAssignmentMetrics();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to auto-assign tickets', 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  // Rebalance tickets
  const handleRebalance = async () => {
    try {
      setRebalancing(true);
      const response = await axiosInstance.post(
        'http://localhost:8000/api/tickets/admin/rebalance'
      );
      addToast(response.data.message, 'success');
      await fetchAssignmentMetrics();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to rebalance tickets', 'error');
    } finally {
      setRebalancing(false);
    }
  };

  // Optimize tickets
  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      const response = await axiosInstance.post(
        'http://localhost:8000/api/tickets/admin/optimize'
      );
      addToast(response.data.message, 'success');
      await fetchAssignmentMetrics();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to optimize tickets', 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string, status: string) => {
    try {
      await axiosInstance.put(API_ENDPOINTS.TICKET_UPDATE(ticketId), { status });
      fetchAdminData();
    } catch (err) {
      console.error('Update ticket error:', err);
    }
  };

  const COLORS = [
    'var(--chart-color-1)',
    'var(--chart-color-3)',
    'var(--chart-color-2)',
    'var(--chart-color-4)',
    'var(--chart-color-5)'
  ];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (userFilter === 'admin') matchesFilter = u.role === 'ADMIN';
    else if (userFilter === 'support') matchesFilter = u.role === 'SUPPORT_AGENT';
    else if (userFilter === 'user') matchesFilter = u.role === 'USER';

    return matchesSearch && matchesFilter;
  });

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    support: users.filter(u => u.role === 'SUPPORT_AGENT').length,
    users: users.filter(u => u.role === 'USER').length
  };

  const getRoleBadgeColor = (role: string): 'error' | 'warning' | 'info' => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'SUPPORT_AGENT': return 'warning';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent page-enter gap-4">
         <div className="relative">
           <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
           <div className="relative bg-card p-4 rounded-full shadow-lg">
              <Loader2 size={32} className="animate-spin text-primary-500" />
           </div>
         </div>
         <p className="text-sm text-surface-500 font-bold uppercase tracking-widest animate-pulse mt-2">Loading Admin Space</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      
      {/* Decorative Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[40%] h-[500px] bg-gradient-to-b from-indigo-500/5 to-transparent blur-[100px] rounded-bl-full"></div>
         <div className="absolute bottom-0 left-0 w-[50%] h-[300px] bg-gradient-to-t from-violet-500/5 to-transparent blur-[100px] rounded-tr-full"></div>
      </div>

      {/* Glass Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-40 transition-all">
        <div className="px-6 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
               </div>
               <div>
                 <h1 className="heading-1 tracking-tight pr-4">Admin Dashboard</h1>
                 <p className="text-sm text-surface-500 font-medium">System configuration and core metrics</p>
               </div>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={() => fetchAdminData(false)}
              loading={refreshing}
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              className="md:mr-2 shadow-sm"
            >
              Refresh Data
            </Button>
          </div>

          <Card className="p-0 border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
            <div className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Role Architecture</p>
                <p className="text-sm font-medium text-surface-600 block md:max-w-2xl">
                  The initial signup becomes the root Admin automatically. Access the Users tab to provision additional Support Agents or alternate Admins.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('users')} className="shrink-0 bg-white dark:bg-card">
                Manage Personnels
              </Button>
            </div>
          </Card>

          {/* Nav Tabs */}
          <div className="-mb-6 md:-mb-8 relative z-10 pt-4">
             <NavigationTabs
               tabs={[
                 { id: 'overview', label: 'Overview', icon: <BarIcon className="w-4 h-4" /> },
                 { id: 'users', label: 'Network Users', icon: <Users className="w-4 h-4" /> },
                 { id: 'assignment', label: 'Copilot Load Balancing', icon: <Zap className="w-4 h-4" /> },
                 { id: 'activity', label: 'Live Activity Logs', icon: <Activity className="w-4 h-4" /> }
               ]}
               activeTab={activeTab}
               onTabChange={(tab) => setActiveTab(tab as AdminTab)}
             />
          </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 px-6 py-10 overflow-y-auto w-full relative z-10">
        <div className="max-w-[1400px] mx-auto pb-12 animate-fade-in-up">
           
           {/* OVERVIEW TAB */}
           {activeTab === 'overview' && (
             <div className="space-y-12">
               
               {/* Health Cards */}
               <div>
                 <div className="flex items-center gap-3 mb-6">
                   <Activity className="w-5 h-5 text-surface-500" />
                   <h2 className="heading-4">System Telemetry</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <StatCard
                     label="Active Users"
                     value={stats?.totalUsers || 0}
                     icon={<Users className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                     trend={{ direction: 'up', value: 12 }}
                   />
                   <StatCard
                     label="Queue Length"
                     value={stats?.totalTickets || 0}
                     icon={<MessageSquare className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                     trend={{ direction: 'down', value: 5 }}
                   />
                   <StatCard
                     label="Memory Spheres"
                     value={stats?.totalKBs || 0}
                     icon={<Database className="w-6 h-6 text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />}
                     trend={{ direction: 'up', value: 3 }}
                   />
                   <Card elevated className="p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
                     <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
                     <div className="flex items-center justify-between mb-4 relative z-10">
                       <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Core Node Status</span>
                       <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                     </div>
                     <p className="heading-2 text-emerald-700 dark:text-emerald-400 mb-1 relative z-10">Healthy</p>
                     <p className="text-xs font-medium text-emerald-600 relative z-10 opacity-80 mt-2 flex items-center gap-1.5"><Check size={12}/> Systems operational</p>
                   </Card>
                 </div>
               </div>

               {/* Quick Tools */}
               <Section title="Quick Deployment Actions" subtitle="One-click workflows for platform orchestration">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <Button variant="glass" fullWidth icon={<Plus className="w-4 h-4 opacity-70" />} onClick={() => addToast('User provisioning coming soon', 'info')} className="justify-start py-4">
                     Provision Network User
                   </Button>
                   <Button variant="glass" fullWidth icon={<Lock className="w-4 h-4 opacity-70" />} onClick={() => setActiveTab('users')} className="justify-start py-4">
                     Audit Roles & Permissions
                   </Button>
                   <Button variant="glass" fullWidth icon={<Download className="w-4 h-4 opacity-70" />} onClick={() => addToast('Data export coming soon', 'info')} className="justify-start py-4">
                     Export Global Snapshot
                   </Button>
                   <Button variant="glass" fullWidth icon={<Filter className="w-4 h-4 opacity-70" />} onClick={() => navigate('/help')} className="justify-start py-4">
                     Inspect Support Helpdesk
                   </Button>
                 </div>
               </Section>

               {/* Analytics Graphs */}
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                 
                 {/* Bar Chart */}
                 <Card elevated className="p-8 space-y-6">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"><BarIcon size={18}/></div>
                     <h3 className="heading-4">AI Confidence Distribution</h3>
                   </div>
                   <div className="h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats?.confidenceDist || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                         <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                         <YAxis stroke="var(--chart-axis)" fontSize={11} axisLine={false} tickLine={false} />
                         <Tooltip
                           contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                           cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                           itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                         />
                         <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                           {stats?.confidenceDist?.map((_entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>

                 {/* Pie Chart */}
                 <Card elevated className="p-8 space-y-6">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Activity size={18}/></div>
                     <h3 className="heading-4">Feedback Distribution</h3>
                   </div>
                   <div className="h-[280px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={stats?.feedbackStats || []}
                           cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={8}
                           dataKey="value"
                           stroke="none"
                         >
                           {stats?.feedbackStats?.map((_entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip
                           contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                           itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                         />
                         <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>
               </div>

               {/* Top Tickets */}
               <Section title="Live High-Priority Flow" subtitle="Most urgent items requiring intervention">
                 <div className="grid gap-3">
                   {stats?.tickets?.slice(0, 5).map((ticket: any) => (
                     <Card key={ticket.id} className="p-5 flex items-center justify-between group border-[1.5px] border-surface-200/60 hover:border-primary-400/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                       <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                         <div className="shrink-0 p-3 rounded-xl bg-surface-100 flex items-center justify-center">
                           <MessageSquare className="w-5 h-5 text-surface-400 group-hover:text-primary-500 transition-colors" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-1">
                             <Badge variant={ticket.priority === 'URGENT' ? 'error' : ticket.priority === 'HIGH' ? 'warning' : 'info'} size="sm" className="shadow-sm">
                               {ticket.priority}
                             </Badge>
                             <p className="font-bold text-[14px] text-foreground truncate group-hover:text-primary-600 transition-colors">{ticket.title}</p>
                           </div>
                           <p className="text-[12px] font-medium text-surface-500">Initiated by {ticket.user?.email}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-4 flex-shrink-0 border-l border-surface-100 pl-4">
                         <Badge variant={ticket.status === 'RESOLVED' ? 'success' : 'info'} size="sm">
                           {ticket.status}
                         </Badge>
                         {ticket.status === 'OPEN' && (
                           <Button variant="ghost" size="sm" onClick={() => handleUpdateTicket(ticket.id, 'IN_PROGRESS')} className="text-primary-600 font-bold hover:bg-primary-50 px-3">
                             Claim
                           </Button>
                         )}
                       </div>
                     </Card>
                   ))}
                   {(!stats?.tickets || stats.tickets.length === 0) && (
                      <div className="text-center py-12 border-2 border-dashed border-surface-200 rounded-3xl bg-surface-50">
                         <Check size={32} className="mx-auto text-emerald-400 mb-4" />
                         <p className="font-bold text-foreground">Zero pending tickets in high priority queue</p>
                      </div>
                   )}
                 </div>
               </Section>
             </div>
           )}

           {/* USERS TAB */}
           {activeTab === 'users' && (
             <div className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { id: 'all', label: 'All Users', count: userStats.total, icon: Users, color: 'text-surface-400' },
                   { id: 'admin', label: 'Root Admins', count: userStats.admins, icon: Shield, color: 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' },
                   { id: 'support', label: 'Support Nodes', count: userStats.support, icon: Zap, color: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' },
                   { id: 'user', label: 'Client Nodes', count: userStats.users, icon: User, color: 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' }
                 ].map((stat) => (
                   <Card key={stat.id} className={`p-5 cursor-pointer border-[1.5px] transition-all hover:-translate-y-1 ${userFilter === stat.id ? 'border-primary-500 bg-primary-50/50 shadow-md ring-1 ring-primary-500/20' : 'border-surface-200/60 hover:border-primary-300 hover:shadow-lg'}`} onClick={() => setUserFilter(stat.id as any)}>
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-[10px] uppercase font-bold tracking-widest text-surface-500 mb-1">{stat.label}</p>
                         <p className={`heading-2 ${userFilter === stat.id ? 'text-primary-700' : 'text-foreground'}`}>{stat.count}</p>
                       </div>
                       <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                     </div>
                   </Card>
                 ))}
               </div>

               <Card elevated className="p-0 overflow-hidden flex flex-col md:flex-row md:items-center gap-0 border-surface-200">
                 <div className="flex-1 bg-transparent p-1.5 focus-within:bg-card">
                   <Input
                     type="text"
                     placeholder="Search node alias or email..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     icon={<Database className="w-4 h-4 ml-2" />}
                     className="border-none shadow-none focus:ring-0 text-sm bg-transparent w-full"
                   />
                 </div>
                 <div className="hidden md:block w-px h-8 bg-surface-200"></div>
                 <div className="p-2 md:p-3 shrink-0 bg-surface-50 border-t md:border-t-0 border-surface-200 flex justify-end">
                    <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />}>
                      Export CSV ({filteredUsers.length})
                    </Button>
                 </div>
               </Card>

               <UserManagement />

               <Card elevated className="p-0 overflow-hidden border border-surface-200/60">
                 <div className="px-6 py-5 border-b border-surface-200/50 bg-surface-50/50">
                    <h3 className="heading-4 text-surface-800">Node Directory <span className="text-sm font-medium text-surface-400 ml-2">({filteredUsers.length} active mappings)</span></h3>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-[13px]">
                     <thead>
                       <tr className="bg-surface-50 text-surface-500 border-b border-surface-200">
                         <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Identity</th>
                         <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Email ID</th>
                         <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Permission Tier</th>
                         <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Network Weight</th>
                         <th className="text-right py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Controls</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-surface-100 font-medium">
                       {filteredUsers.map(user => (
                         <tr key={user.id} className="hover:bg-primary-50/30 transition-colors group">
                           <td className="py-4 px-6">
                             <div className="flex items-center gap-3">
                               {user.picture ? (
                                 <img src={user.picture} alt="" className="w-8 h-8 rounded-full shadow-sm ring-2 ring-transparent group-hover:ring-primary-200 transition-all" />
                               ) : (
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-xs ring-2 ring-transparent group-hover:ring-indigo-200 transition-all">
                                   {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                 </div>
                               )}
                               <span className="text-foreground group-hover:text-primary-700 transition-colors">{user.name}</span>
                             </div>
                           </td>
                           <td className="py-4 px-6 text-surface-600">{user.email}</td>
                           <td className="py-4 px-6">
                             <Badge variant={user.role === 'ADMIN' ? 'error' : user.role === 'SUPPORT_AGENT' ? 'warning' : 'info'} size="sm" className="shadow-sm">
                               {user.role.replace('_', ' ')}
                             </Badge>
                           </td>
                           <td className="py-4 px-6">
                             <div className="flex items-center gap-4 text-surface-500">
                               <div className="flex items-center gap-1.5" title="Support Channels Activity">
                                  <MessageSquare size={14} className="text-surface-400" />
                                  <span>{user._count?.chats || 0}</span>
                               </div>
                               <div className="flex items-center gap-1.5" title="Spheres Managed">
                                  <Database size={14} className="text-surface-400" />
                                  <span>{user._count?.knowledgeBases || 0}</span>
                               </div>
                             </div>
                           </td>
                           <td className="py-4 px-6 text-right">
                             <Button
                               variant="glass"
                               size="sm"
                               icon={<Edit2 className="w-3.5 h-3.5" />}
                               onClick={() => handleSelectUser(user)}
                               className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0"
                             >
                               Modify
                             </Button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
                 {filteredUsers.length === 0 && (
                   <div className="text-center py-16 text-surface-500 bg-surface-50/50">
                     <Filter className="w-10 h-10 mx-auto text-surface-300 mb-3" />
                     <p className="font-bold text-foreground">Zero matches found</p>
                     <p className="text-sm mt-1">Adjust search parameters</p>
                   </div>
                 )}
               </Card>
             </div>
           )}

           {/* LOGS TAB */}
           {activeTab === 'activity' && (
             <div className="space-y-8">
               <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h2 className="heading-4">Network Telemetry Analysis</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card elevated className="p-8 space-y-4 relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                   <div className="flex items-center justify-between relative z-10">
                     <h4 className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Adoption Velocity</h4>
                     <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                   </div>
                   <p className="text-4xl font-black tracking-tight text-foreground relative z-10">+24%</p>
                   <p className="text-sm font-medium text-emerald-600 relative z-10">Trailing 30 days cycle</p>
                 </Card>

                 <Card elevated className="p-8 space-y-4 relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                   <div className="flex items-center justify-between relative z-10">
                     <h4 className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Closure Efficiency</h4>
                     <TrendingUp className="w-5 h-5 text-blue-500" />
                   </div>
                   <p className="text-4xl font-black tracking-tight text-foreground relative z-10">94%</p>
                   <p className="text-sm font-medium text-blue-600 relative z-10">Global resolution mean</p>
                 </Card>

                 <Card elevated className="p-8 space-y-4 relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                   <div className="flex items-center justify-between relative z-10">
                     <h4 className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Copilot Precision</h4>
                     <TrendingUp className="w-5 h-5 text-amber-500" />
                   </div>
                   <p className="text-4xl font-black tracking-tight text-foreground relative z-10">92.3%</p>
                   <p className="text-sm font-medium text-amber-600 relative z-10">Aggregated confidence index</p>
                 </Card>
               </div>

               <Card elevated className="p-0 overflow-hidden">
                 <div className="px-6 py-5 border-b border-surface-200/50 bg-surface-50/50 flex items-center gap-3">
                   <Activity size={18} className="text-surface-500" />
                   <h3 className="heading-4 text-surface-800">Event Stream Pipeline</h3>
                 </div>
                 <div className="p-2">
                   {['User John registered node identity', 'Admin elevated internal credentials for node Sarah', 'Memory Sphere KB.Core initialized', 'High-priority ticket intercept resolved', 'Automated cluster rebalance cycle finished'].map((activity, i) => (
                     <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-50 transition-colors group">
                       <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover:scale-150 transition-transform"></div>
                       <div className="flex-1">
                         <p className="text-[14px] font-medium text-surface-900 leading-snug">{activity}</p>
                         <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 mt-1">Runtime log — T-{(i+1)*2} mins</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </Card>
             </div>
           )}

           {/* ASSIGNMENT TAB */}
           {activeTab === 'assignment' && (
             <div className="space-y-8 animate-fade-in">
               
               <Card elevated className="p-0 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,theme(colors.amber.500/0.05),transparent_50%)] pointer-events-none transition-opacity"></div>
                  <div className="p-8 pb-6 border-b border-surface-200/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600"><Zap size={20}/></div>
                      <h3 className="heading-3 text-foreground">Copilot Load Optimizer</h3>
                    </div>
                    <p className="text-sm font-medium text-surface-500 ml-12 pl-1 max-w-2xl">Execute algorithmic distribution scripts to perfectly balance incoming queue requests across available Support Nodes.</p>
                  </div>
                  
                  <div className="p-6 bg-surface-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="primary"
                      className="py-6 justify-center shadow-md shadow-primary-500/20"
                      onClick={handleAutoAssign}
                      loading={autoAssigning}
                      disabled={autoAssigning || !assignmentMetrics?.unassigned || assignmentMetrics.unassigned === 0}
                    >
                      <Zap size={18} className="mr-2" /> Quick Sweep ({assignmentMetrics?.unassigned || 0})
                    </Button>
                    <Button
                      variant="glass"
                      className="py-6 justify-center bg-white dark:bg-card border-surface-200 shadow-sm"
                      onClick={handleRebalance}
                      loading={rebalancing}
                      disabled={rebalancing}
                    >
                      <RefreshCw size={18} className={`mr-2 ${rebalancing ? 'animate-spin' : ''}`} /> Force Rebalance
                    </Button>
                    <Button
                      variant="glass"
                      className="py-6 justify-center bg-white dark:bg-card border-surface-200 shadow-sm"
                      onClick={handleOptimize}
                      loading={optimizing}
                      disabled={optimizing}
                    >
                      <TrendingUp size={18} className="mr-2" /> Target Slow Tickets
                    </Button>
                  </div>
               </Card>

               {assignmentLoading ? (
                 <div className="flex flex-col items-center justify-center py-24 gap-4">
                   <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                   <p className="text-[12px] font-bold uppercase tracking-widest text-surface-500 animate-pulse">Running diagnostic check</p>
                 </div>
               ) : assignmentMetrics ? (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <StatCard
                       label="Active Vol"
                       value={assignmentMetrics.totalTickets}
                       icon={<MessageSquare className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                       trend={{ direction: 'up', value: 0 }}
                     />
                     <StatCard
                       label="Cleared (30d)"
                       value={assignmentMetrics.totalResolved}
                       icon={<Check className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                       trend={{ direction: 'up', value: 0 }}
                     />
                     <StatCard
                       label="Orphaned"
                       value={assignmentMetrics.unassigned}
                       icon={<Filter className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                       trend={{ direction: 'down', value: 0 }}
                     />
                     <Card elevated className="p-6 relative overflow-hidden border-primary-500/10">
                       <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-400 via-amber-400 to-rose-400"></div>
                       <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Fairness Index</span>
                         <span className="text-3xl font-black text-foreground pr-2">
                           {assignmentMetrics.averageLoadScore?.toFixed(1) || 0}
                         </span>
                       </div>
                       <p className="text-xs font-medium text-surface-500 mt-2">Target &lt; 50.0</p>
                     </Card>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                      <Card className="p-6 space-y-4 border-l-4 border-l-primary-500 bg-primary-50/10 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Info size={18} className="text-primary-500" />
                          <h4 className="font-bold text-surface-900">Index Decoupler Reference</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] font-medium pt-2">
                          <div className="flex flex-col gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                            <span className="text-green-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> Score 0-33</span>
                            <span className="text-surface-600">Light utilization queue. Ready for incoming dispatch injections.</span>
                          </div>
                          <div className="flex flex-col gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <span className="text-amber-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div> Score 34-66</span>
                            <span className="text-surface-600">Optimal processing limits. Capable of handling slow overflow.</span>
                          </div>
                          <div className="flex flex-col gap-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                            <span className="text-rose-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div> Score 67-100</span>
                            <span className="text-surface-600">Saturated pipeline node. Trigger force rebalance script.</span>
                          </div>
                        </div>
                      </Card>

                     <Card elevated className="p-0 overflow-hidden border-surface-200">
                       <div className="px-6 py-5 border-b border-surface-200/50 bg-surface-50/50">
                         <h3 className="heading-4">Load Matrices <span className="text-sm font-medium text-primary-500">Live</span></h3>
                       </div>
                       <div className="overflow-x-auto">
                         <table className="w-full text-[13px]">
                           <thead>
                             <tr className="bg-surface-50 text-surface-500 border-b border-surface-200">
                               <th className="text-left py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Support Node Identity</th>
                               <th className="text-center py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Open Volume</th>
                               <th className="text-center py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Clear Rate (30d)</th>
                               <th className="text-center py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Closure Mean</th>
                               <th className="text-center py-4 px-6 font-bold uppercase tracking-wider text-[10px] w-64">Distribution Index</th>
                               <th className="text-center py-4 px-6 font-bold uppercase tracking-wider text-[10px]">Target State</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-surface-100 font-medium">
                             {assignmentMetrics.agents?.map((agent: any) => (
                               <tr key={agent.id} className="hover:bg-primary-50/20 transition-colors">
                                 <td className="py-4 px-6">
                                   <div>
                                     <p className="font-bold text-foreground">{agent.name}</p>
                                     <p className="text-[11px] font-mono text-surface-400 mt-0.5">{agent.email}</p>
                                   </div>
                                 </td>
                                 <td className="text-center py-4 px-6">
                                   <div className="inline-flex items-center justify-center bg-primary-100 text-primary-700 w-8 h-8 rounded-full font-bold shadow-sm ring-2 ring-primary-50">
                                     {agent.assignedTickets}
                                   </div>
                                 </td>
                                 <td className="text-center py-4 px-6 text-foreground font-bold">
                                   {agent.resolvedTickets}
                                 </td>
                                 <td className="text-center py-4 px-6 text-surface-600">
                                   {agent.avgResolutionTime?.toFixed(1)}h
                                 </td>
                                 <td className="text-center py-4 px-6">
                                   <div className="flex items-center gap-3 justify-center w-full max-w-[200px] mx-auto">
                                      <div className="flex-1 h-2 rounded-full bg-surface-100 overflow-hidden shadow-inner">
                                        <div
                                          className={`h-full rounded-full transition-all duration-1000 ease-out ${agent.loadScore <= 33 ? 'bg-green-500' : agent.loadScore <= 66 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                          style={{ width: `${Math.min(100, agent.loadScore)}%` }}
                                        />
                                      </div>
                                      <span className={`text-[12px] font-bold w-6 text-right ${agent.loadScore <= 33 ? 'text-green-600' : agent.loadScore <= 66 ? 'text-amber-600' : 'text-rose-600'}`}>{agent.loadScore.toFixed(0)}</span>
                                   </div>
                                 </td>
                                 <td className="text-center py-4 px-6">
                                   <Badge variant={agent.isAvailable ? 'success' : 'warning'} size="sm" className="shadow-sm">
                                     {agent.isAvailable ? 'Dispatch Ready' : 'Throttle Hold'}
                                   </Badge>
                                 </td>
                               </tr>
                             ))}
                             {(!assignmentMetrics.agents || assignmentMetrics.agents.length === 0) && (
                               <tr>
                                 <td colSpan={6} className="text-center py-10 text-surface-500 bg-surface-50/50 font-medium">No valid support nodes found in index cache.</td>
                               </tr>
                             )}
                           </tbody>
                         </table>
                       </div>
                     </Card>
                   </div>
                 </>
               ) : null}
             </div>
           )}
        </div>
      </div>

      {/* Role Manager Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Permission Gateway Configuration"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="ghost" fullWidth onClick={() => setShowRoleModal(false)} disabled={updatingRole}>
              Abort Change
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleChangeRole}
              loading={updatingRole}
              disabled={updatingRole || newRole === selectedUser?.role}
              className="bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 border-none"
            >
              Write Permissions
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 border border-surface-200">
               {selectedUser.picture ? (
                 <img src={selectedUser.picture} alt="" className="w-12 h-12 rounded-full shadow-sm" />
               ) : (
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm ring-2 ring-white">
                   {selectedUser.name?.[0]?.toUpperCase() || selectedUser.email[0].toUpperCase()}
                 </div>
               )}
               <div className="min-w-0 flex-1">
                 <p className="font-bold text-[15px] text-foreground truncate">{selectedUser.name}</p>
                 <p className="text-[12px] text-surface-500 font-mono truncate mt-0.5">{selectedUser.email}</p>
               </div>
               <div className="shrink-0">
                  <Badge variant={getRoleBadgeColor(selectedUser.role)} size="sm">Current: {selectedUser.role}</Badge>
               </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                 <p className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Inject Node Target Profile</p>
              </div>
              <div className="grid gap-3">
                {[
                  { id: 'ADMIN', badge: 'error', label: 'Root Admin Node', desc: 'Absolute read/write gateway across global infrastructure.' },
                  { id: 'SUPPORT_AGENT', badge: 'warning', label: 'Support Resolution Node', desc: 'Active queue dispatcher payload. Requires workflow assignment mapping.' },
                  { id: 'USER', badge: 'info', label: 'Client Origin Node', desc: 'Standard support intake. Reverts privileges entirely.' }
                ].map(role => (
                   <label key={role.id} className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border-[1.5px] ${newRole === role.id ? 'border-primary-500 bg-primary-50 shadow-md ring-1 ring-primary-500/20' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'}`}>
                      <div className="flex h-5 items-center shrink-0 mt-0.5">
                        <input
                          type="radio"
                          value={role.id}
                          checked={newRole === role.id}
                          onChange={() => setNewRole(role.id as any)}
                          className="w-4 h-4 text-primary-600 border-surface-300 focus:ring-primary-600 focus:ring-2 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <p className={`font-bold text-[14px] ${newRole === role.id ? 'text-primary-800' : 'text-foreground'}`}>{role.label}</p>
                           {newRole === role.id && <Check size={14} className="text-primary-600" />}
                         </div>
                         <p className="text-[12px] text-surface-500 font-medium leading-relaxed">{role.desc}</p>
                      </div>
                      <div className="hidden sm:block shrink-0">
                         <Badge variant={role.badge as any} size="sm">{role.id}</Badge>
                      </div>
                   </label>
                ))}
              </div>
            </div>
            
            {newRole !== selectedUser.role && (
               <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 animate-fade-in-up">
                  <div className="mt-0.5 text-amber-500 shrink-0"><AlertTriangle size={16} /></div>
                  <p className="text-[12px] font-medium text-amber-700 leading-relaxed">
                     Node permissions will cycle upon next client sequence rendering. Proceed with overwrite?
                  </p>
               </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;
