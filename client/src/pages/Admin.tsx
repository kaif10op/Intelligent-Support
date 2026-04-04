import { useEffect, useState } from 'react';
import { Users, Database, Shield, Zap, BarChart as BarIcon, Activity, Loader2, MessageSquare, Edit2, User, TrendingUp, ArrowUpRight, Filter, Download, RefreshCw, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import axiosInstance, { API_ENDPOINTS } from '../config/api';
import UserManagement from '../components/UserManagement';
import { Button, Card, Input, Modal, StatCard, NavigationTabs, Badge, Section } from '../components/ui';

type AdminTab = 'overview' | 'users' | 'activity';

const Admin = () => {
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

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.ADMIN_STATS),
        axiosInstance.get(API_ENDPOINTS.ADMIN_USERS)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    try {
      setUpdatingRole(true);
      await axiosInstance.put(
        `${API_ENDPOINTS.ADMIN_USERS}/${selectedUser.id}/role`,
        { role: newRole }
      );
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
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
    const matchesFilter = userFilter === 'all' || u.role === userFilter;
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-white sticky top-0 z-40">
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
              onClick={() => fetchAdminData()}
              loading={refreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>

          {/* Tabs */}
          <NavigationTabs
            tabs={[
              { id: 'overview', label: 'Overview', icon: <BarIcon className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
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
                <Button variant="secondary" fullWidth icon={<User className="w-4 h-4" />}>
                  Add New User
                </Button>
                <Button variant="secondary" fullWidth icon={<Lock className="w-4 h-4" />}>
                  Manage Roles
                </Button>
                <Button variant="secondary" fullWidth icon={<Download className="w-4 h-4" />}>
                  Export Report
                </Button>
                <Button variant="secondary" fullWidth icon={<Filter className="w-4 h-4" />}>
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
