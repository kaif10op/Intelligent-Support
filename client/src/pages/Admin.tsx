import { useEffect, useState } from 'react';
import { Users, Database, Shield, Zap, BarChart as BarIcon, PieChart as PieIcon, Activity, Loader2, AlertCircle, MessageSquare, Edit2, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import axiosInstance, { API_ENDPOINTS } from '../config/api';
import UserManagement from '../components/UserManagement';
import { Button, Card, Input, Modal, StatCard, NavigationTabs } from '../components/ui';

type AdminTab = 'overview' | 'users';

const Admin = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN' | 'SUPPORT_AGENT'>('USER');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, chatsRes] = await Promise.all([
        axiosInstance.get(API_ENDPOINTS.ADMIN_STATS),
        axiosInstance.get(API_ENDPOINTS.ADMIN_USERS),
        axiosInstance.get(API_ENDPOINTS.ADMIN_CHATS).catch(() => ({ data: [] }))
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

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setUpdatingRole(true);
      const response = await axiosInstance.put(
        `${API_ENDPOINTS.ADMIN_USERS}/${selectedUser.id}/role`,
        { role: newRole }
      );

      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setShowRoleModal(false);
      setSelectedUser(null);

      console.log('Role updated successfully:', response.data);
    } catch (err: any) {
      console.error('Error updating role:', err);
      alert(`Error: ${err.response?.data?.error || 'Failed to update user role'}`);
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading admin analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="heading-1">Admin Dashboard</h1>
              <p className="text-surface-600 mt-1">Global platform overview and user management</p>
            </div>
          </div>

          {/* Tabs */}
          <NavigationTabs
            tabs={[
              { id: 'overview', label: 'Overview', icon: <BarIcon className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as AdminTab)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'users' ? (
          <UserManagement />
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Total Users"
                value={stats?.totalUsers || 0}
                icon={<Users className="w-8 h-8 text-primary-500" />}
                trend={{ direction: 'up', value: 12 }}
              />
              <StatCard
                label="Knowledge Bases"
                value={stats?.totalKBs || 0}
                icon={<Database className="w-8 h-8 text-primary-500" />}
                trend={{ direction: 'up', value: 8 }}
              />
              <StatCard
                label="Total Tickets"
                value={stats?.totalTickets || 0}
                icon={<Zap className="w-8 h-8 text-primary-500" />}
                trend={{ direction: 'up', value: 5 }}
              />
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Confidence Distribution */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <BarIcon className="w-5 h-5 text-primary-500" />
                  <h3 className="heading-4">AI Confidence Distribution</h3>
                </div>
                <div className="h-64 -mx-6">
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

              {/* User Feedback Quality */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <PieIcon className="w-5 h-5 text-primary-500" />
                  <h3 className="heading-4">User Feedback Quality</h3>
                </div>
                <div className="h-64 -mx-6">
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
                        contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* User Management */}
            <Card elevated className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="heading-3">User Management</h2>
                  <p className="text-sm text-surface-600 mt-1">{filteredUsers.length} users found</p>
                </div>
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<MessageSquare className="w-4 h-4" />}
                  className="md:w-64"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-50 border-b border-surface-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">Created</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">Activity</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {user.picture ? (
                              <img src={user.picture} alt="" className="w-9 h-9 rounded-full border border-surface-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-surface-600" />
                              </div>
                            )}
                            <span className="font-medium text-surface-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-surface-600">{user.email}</td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            user.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'SUPPORT_AGENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-surface-100 text-surface-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-surface-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4 text-primary-500" />
                              <span className="text-surface-900 font-medium">{user._count?.chats || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Database className="w-4 h-4 text-primary-500" />
                              <span className="text-surface-900 font-medium">{user._count?.knowledgeBases || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit2 className="w-4 h-4" />}
                            onClick={() => handleSelectUser(user)}
                          >
                            Change Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-600">No users found</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Ticket Management */}
            <Card elevated className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="heading-3">Ticket Management</h2>
                  <p className="text-sm text-surface-600 mt-1">Recent Support Tickets</p>
                </div>
                <div className="flex items-center gap-2 text-surface-600 text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Recent Tickets</span>
                </div>
              </div>

              <div className="space-y-3">
                {stats?.tickets && stats.tickets.length > 0 ? (
                  stats.tickets.map((ticket: any) => (
                    <Card interactive key={ticket.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Priority Badge */}
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${
                          ticket.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority}
                        </span>

                        {/* Ticket Info */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-surface-900 truncate">{ticket.title}</h4>
                          <p className="text-xs text-surface-600 mt-1">from <span className="font-medium">{ticket.user?.email}</span></p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          ticket.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status}
                        </span>

                        {ticket.status === 'OPEN' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateTicket(ticket.id, 'IN_PROGRESS')}
                          >
                            Handle
                          </Button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateTicket(ticket.id, 'RESOLVED')}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-600">No active tickets to manage</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Chat Management */}
            <Card elevated className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="heading-3">Chat Management</h2>
                  <p className="text-sm text-surface-600 mt-1">{filteredChats.length} chats found</p>
                </div>
                <Input
                  type="text"
                  placeholder="Search by title, user, or KB..."
                  value={chatSearchTerm}
                  onChange={(e) => setChatSearchTerm(e.target.value)}
                  icon={<MessageSquare className="w-4 h-4" />}
                  className="md:w-80"
                />
              </div>

              <div className="space-y-3">
                {filteredChats.length > 0 ? (
                  filteredChats.slice(0, 10).map((chat) => (
                    <Link
                      key={chat.id}
                      to={`/chat/${chat.id}?kbId=${chat.kbId}`}
                    >
                      <Card interactive className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-primary-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-surface-900 truncate">{chat.title || 'Untitled Chat'}</h4>
                            <div className="flex items-center gap-2 text-xs text-surface-600 mt-1">
                              <span className="truncate">User: {chat.user?.name || 'Unknown'}</span>
                              <span>•</span>
                              <span className="truncate">KB: {chat.kb?.title || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-surface-600">{chat.messages?.length || 0} messages</span>
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-primary-100 text-primary-600 font-medium">View</span>
                        </div>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-600">
                      {chats.length === 0 ? 'No active chats' : 'No chats match your search'}
                    </p>
                  </div>
                )}
                {filteredChats.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-surface-600">Showing 10 of {filteredChats.length} chats</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Change User Role"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowRoleModal(false)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleChangeRole}
              loading={updatingRole}
              disabled={updatingRole || newRole === selectedUser?.role}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              {updatingRole ? 'Updating...' : 'Update Role'}
            </Button>
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            <div>
              <p className="text-surface-600">Update role for <span className="font-semibold text-surface-900">{selectedUser.name}</span></p>
            </div>

            {/* User Info */}
            <Card className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase mb-1">Name</p>
                <p className="text-surface-900">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase mb-1">Email</p>
                <p className="text-surface-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-surface-600 uppercase mb-1">Current Role</p>
                <p className={`text-sm font-bold px-2.5 py-1 rounded-lg inline-block ${
                  selectedUser.role === 'ADMIN'
                    ? 'bg-blue-100 text-blue-800'
                    : selectedUser.role === 'SUPPORT_AGENT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-surface-100 text-surface-700'
                }`}>
                  {selectedUser.role}
                </p>
              </div>
            </Card>

            {/* Role Selection */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-surface-900">New Role</p>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  newRole === 'USER'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:border-surface-300'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="USER"
                    checked={newRole === 'USER'}
                    onChange={(e) => setNewRole(e.target.value as 'USER')}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-surface-900">User</p>
                    <p className="text-xs text-surface-600">Can create chats and manage their own KBs</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  newRole === 'SUPPORT_AGENT'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:border-surface-300'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="SUPPORT_AGENT"
                    checked={newRole === 'SUPPORT_AGENT'}
                    onChange={(e) => setNewRole(e.target.value as 'SUPPORT_AGENT')}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-surface-900">Support Agent</p>
                    <p className="text-xs text-surface-600">Can handle and resolve support tickets</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  newRole === 'ADMIN'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:border-surface-300'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={newRole === 'ADMIN'}
                    onChange={(e) => setNewRole(e.target.value as 'ADMIN')}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-surface-900">Admin</p>
                    <p className="text-xs text-surface-600">Full access to admin dashboard and management</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;
