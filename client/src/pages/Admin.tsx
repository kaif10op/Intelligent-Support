import { useEffect, useState } from 'react';
import { Users, Database, Shield, Zap, BarChart as BarIcon, Activity, Loader2, MessageSquare, Edit2, User, TrendingUp, ArrowUpRight, Filter, Download, RefreshCw, Lock, Plus } from 'lucide-react';
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

  const fetchAdminData = async (isInitial = false) => {
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
  };

  useEffect(() => {
    fetchAdminData(true);
  }, []);

  // Load assignment metrics when tab is active
  useEffect(() => {
    if (activeTab === 'assignment') {
      fetchAssignmentMetrics();
    }
  }, [activeTab]);

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
  const fetchAssignmentMetrics = async () => {
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
  };

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

  const COLORS = ['#3b82f6', '#f59e0b', '#06b6d4', '#ef4444', '#10b981'];

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
      case 'ADMIN':
        return 'error';
      case 'SUPPORT_AGENT':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50/90 backdrop-blur sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="heading-2">Admin Dashboard</h1>
                <p className="text-sm text-surface-600">System overview & management</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchAdminData(false)}
              loading={refreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>

          <Card className="p-4 mb-4 border border-primary-200 bg-primary-50/70">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-surface-900">Role setup</p>
                <p className="text-sm text-surface-600">
                  The first signup becomes Admin automatically. Use the Users tab to promote teammates to Support Agent or Admin.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('users')}>
                Manage users
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <NavigationTabs
            tabs={[
              { id: 'overview', label: 'Overview', icon: <BarIcon className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
              { id: 'assignment', label: 'Assignment', icon: <Zap className="w-4 h-4" /> },
              { id: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as AdminTab)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h2 className="heading-3 mb-4">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Total Users"
                  value={stats?.totalUsers || 0}
                  icon={<Users className="w-8 h-8 text-primary-600" />}
                  trend={{ direction: 'up', value: 12 }}
                />
                <StatCard
                  label="Tickets Today"
                  value={stats?.totalTickets || 0}
                  icon={<MessageSquare className="w-8 h-8 text-amber-600" />}
                  trend={{ direction: 'down', value: 5 }}
                />
                <StatCard
                  label="Knowledge Bases"
                  value={stats?.totalKBs || 0}
                  icon={<Database className="w-8 h-8 text-blue-600" />}
                  trend={{ direction: 'up', value: 3 }}
                />
                <Card elevated className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-600">System Status</span>
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <p className="heading-3">Healthy</p>
                  <p className="text-xs text-green-600">✓ All systems operational</p>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <Section title="Quick Actions" subtitle="Common admin tasks">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="secondary" fullWidth icon={<Plus className="w-4 h-4" />} onClick={() => {
                  addToast('User creation coming soon', 'info');
                }}>
                  Add New User
                </Button>
                <Button variant="secondary" fullWidth icon={<Lock className="w-4 h-4" />} onClick={() => {
                  setActiveTab('users');
                }}>
                  Manage Roles
                </Button>
                <Button variant="secondary" fullWidth icon={<Download className="w-4 h-4" />} onClick={() => {
                  addToast('Export feature coming soon', 'info');
                }}>
                  Export Report
                </Button>
                <Button variant="secondary" fullWidth icon={<Filter className="w-4 h-4" />} onClick={() => {
                  navigate('/help');
                }}>
                  View Logs
                </Button>
              </div>
            </Section>

            {/* Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Confidence Distribution */}
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">AI Confidence Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.confidenceDist || []}>
                      <XAxis dataKey="name" stroke="#868e96" fontSize={12} />
                      <YAxis stroke="#868e96" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {stats?.confidenceDist?.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Feedback Stats */}
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">User Feedback Quality</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.feedbackStats || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats?.feedbackStats?.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Top Tickets */}
            <Section title="Top Support Tickets" subtitle="Most active conversations">
              <div className="space-y-3">
                {stats?.tickets?.slice(0, 5).map((ticket: any) => (
                  <Card key={ticket.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant={ticket.priority === 'URGENT' ? 'error' : ticket.priority === 'HIGH' ? 'warning' : 'info'}>
                        {ticket.priority}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-900 truncate">{ticket.title}</p>
                        <p className="text-xs text-surface-600">from {ticket.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={ticket.status === 'RESOLVED' ? 'success' : 'info'}>
                        {ticket.status}
                      </Badge>
                      {ticket.status === 'OPEN' && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateTicket(ticket.id, 'IN_PROGRESS')}>
                          Handle
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setUserFilter('all')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-600 font-medium">All Users</p>
                    <p className="heading-3">{userStats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-surface-300" />
                </div>
              </Card>
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setUserFilter('admin')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-600 font-medium">Admins</p>
                    <p className="heading-3">{userStats.admins}</p>
                  </div>
                  <Shield className="w-8 h-8 text-red-300" />
                </div>
              </Card>
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setUserFilter('support')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-600 font-medium">Support Agents</p>
                    <p className="heading-3">{userStats.support}</p>
                  </div>
                  <Zap className="w-8 h-8 text-amber-300" />
                </div>
              </Card>
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setUserFilter('user')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-surface-600 font-medium">Regular Users</p>
                    <p className="heading-3">{userStats.users}</p>
                  </div>
                  <User className="w-8 h-8 text-blue-300" />
                </div>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card elevated className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MessageSquare className="w-4 h-4" />}
                className="md:flex-1"
              />
              <Button variant="secondary" size="md" icon={<Download className="w-4 h-4" />}>
                Export ({filteredUsers.length})
              </Button>
            </Card>

            {/* Users List */}
            <UserManagement />

            {/* User Details Table */}
            <Card elevated className="p-6 overflow-x-auto">
              <h3 className="heading-4 mb-4">User Details ({filteredUsers.length})</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-3 px-4 font-semibold text-surface-600">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-600">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-600">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-600">Activity</th>
                    <th className="text-left py-3 px-4 font-semibold text-surface-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.picture && (
                            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                          )}
                          <span className="font-medium text-surface-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-surface-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <Badge variant={user.role === 'ADMIN' ? 'error' : user.role === 'SUPPORT_AGENT' ? 'warning' : 'info'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-4 text-xs text-surface-600">
                          <span>Chats: {user._count?.chats || 0}</span>
                          <span>KBs: {user._count?.knowledgeBases || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-4 h-4" />}
                          onClick={() => handleSelectUser(user)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-surface-500">
                  No users found matching your criteria
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <Section title="Quick Insights" subtitle="Key metrics and trends">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card elevated className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-surface-900">User Growth</h4>
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="heading-2">+24%</p>
                  <p className="text-sm text-surface-600">Last 30 days</p>
                </Card>

                <Card elevated className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-surface-900">Ticket Resolution</h4>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="heading-2">94%</p>
                  <p className="text-sm text-surface-600">Avg resolution rate</p>
                </Card>

                <Card elevated className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-surface-900">AI Accuracy</h4>
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="heading-2">92.3%</p>
                  <p className="text-sm text-surface-600">Confidence score</p>
                </Card>
              </div>
            </Section>

            {/* Recent Activity */}
            <Card elevated className="p-6 space-y-4">
              <h3 className="heading-4">Recent Activity</h3>
              <div className="space-y-3">
                {['User John registered', 'Admin role assigned to Sarah', 'New KB created', 'Ticket #123 resolved', 'System backup completed'].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-surface-900">{activity}</p>
                      <p className="text-xs text-surface-500">Just now</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Assignment Tab */}
        {activeTab === 'assignment' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <Card elevated className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="heading-4 mb-2">Ticket Assignment Controls</h3>
                  <p className="text-sm text-surface-600 mb-4">Manage intelligent ticket distribution among support agents</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleAutoAssign}
                    loading={autoAssigning}
                    disabled={autoAssigning || !assignmentMetrics?.unassigned || assignmentMetrics.unassigned === 0}
                    icon={<Zap className="w-4 h-4" />}
                  >
                    Auto-Assign ({assignmentMetrics?.unassigned || 0})
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleRebalance}
                    loading={rebalancing}
                    disabled={rebalancing}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Rebalance Workload
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleOptimize}
                    loading={optimizing}
                    disabled={optimizing}
                    icon={<TrendingUp className="w-4 h-4" />}
                  >
                    Optimize Slow Tickets
                  </Button>
                </div>
              </div>
            </Card>

            {/* Metrics */}
            {assignmentLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : assignmentMetrics ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    label="Total Active Tickets"
                    value={assignmentMetrics.totalTickets}
                    icon={<MessageSquare className="w-8 h-8 text-primary-600" />}
                  />
                  <StatCard
                    label="Resolved Tickets"
                    value={assignmentMetrics.totalResolved}
                    icon={<TrendingUp className="w-8 h-8 text-green-600" />}
                  />
                  <StatCard
                    label="Unassigned"
                    value={assignmentMetrics.unassigned}
                    icon={<Filter className="w-8 h-8 text-amber-600" />}
                  />
                  <Card elevated className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-surface-600">Avg Load Score</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {assignmentMetrics.averageLoadScore?.toFixed(1) || 0}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500">Distribution fairness (0-100)</p>
                  </Card>
                </div>

                {/* Agent Metrics Table */}
                <Card elevated className="p-6 overflow-x-auto">
                  <h3 className="heading-4 mb-4">Support Agent Workload</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="text-left py-3 px-4 font-semibold text-surface-600">Agent</th>
                        <th className="text-center py-3 px-4 font-semibold text-surface-600">Open Tickets</th>
                        <th className="text-center py-3 px-4 font-semibold text-surface-600">Resolved (30d)</th>
                        <th className="text-center py-3 px-4 font-semibold text-surface-600">Avg Time</th>
                        <th className="text-center py-3 px-4 font-semibold text-surface-600">Load Score</th>
                        <th className="text-center py-3 px-4 font-semibold text-surface-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentMetrics.agents?.map((agent: any) => (
                        <tr key={agent.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-surface-900">{agent.name}</p>
                              <p className="text-xs text-surface-500">{agent.email}</p>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-medium">
                              {agent.assignedTickets}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4 text-surface-900 font-medium">
                            {agent.resolvedTickets}
                          </td>
                          <td className="text-center py-3 px-4 text-surface-900">
                            {agent.avgResolutionTime?.toFixed(1)}h
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-surface-200">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    agent.loadScore <= 33 ? 'bg-green-500' :
                                    agent.loadScore <= 66 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, agent.loadScore)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold min-w-8">{agent.loadScore.toFixed(0)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant={agent.isAvailable ? 'success' : 'warning'}>
                              {agent.isAvailable ? 'Available' : 'Busy'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                {/* Legend */}
                <Card className="p-6 space-y-3">
                  <h4 className="font-semibold text-surface-900">Load Score Explanation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-surface-600"><strong>0-33:</strong> Light load (ready for tickets)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-surface-600"><strong>34-66:</strong> Moderate load (working well)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-surface-600"><strong>67-100:</strong> High load (consider rebalance)</span>
                    </div>
                  </div>
                </Card>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Change User Role"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRoleModal(false)} disabled={updatingRole}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleChangeRole}
              loading={updatingRole}
              disabled={updatingRole || newRole === selectedUser?.role}
            >
              Update Role
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            <Card className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase">Name</p>
                <p className="text-surface-900 font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase">Email</p>
                <p className="text-surface-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase">Current Role</p>
                <Badge variant={getRoleBadgeColor(selectedUser.role)}>
                  {selectedUser.role}
                </Badge>
              </div>
            </Card>

            <div>
              <p className="text-sm font-semibold text-surface-900 mb-3">Select New Role</p>
              <div className="space-y-2">
                {['USER', 'SUPPORT_AGENT', 'ADMIN'].map(role => (
                  <label key={role} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    newRole === role
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 hover:border-primary-300'
                  }`}>
                    <input
                      type="radio"
                      value={role}
                      checked={newRole === role}
                      onChange={() => setNewRole(role as any)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-surface-900">{role.replace('_', ' ')}</p>
                      <p className="text-xs text-surface-600">
                        {role === 'ADMIN' ? 'Full system access' :
                         role === 'SUPPORT_AGENT' ? 'Handle tickets and support' :
                         'Regular user access'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;
