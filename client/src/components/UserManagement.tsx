import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../config/api';
import { Shield, User, Users, Mail, Edit2, Search, RefreshCw, CheckSquare, Square } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'ADMIN' | 'SUPPORT_AGENT' | 'USER';
  createdAt: string;
}

type Role = 'ADMIN' | 'SUPPORT_AGENT' | 'USER';
type SortKey = 'name' | 'email' | 'createdAt';
type RoleFilter = 'ALL' | Role;

const roleOptions: Role[] = ['USER', 'SUPPORT_AGENT', 'ADMIN'];

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<Role>('USER');
  const [savingRole, setSavingRole] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<Role>('USER');
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const normalizeUsersPayload = (payload: any): UserData[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN_USERS);
      setUsers(normalizeUsersPayload(response.data));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const setTemporarySuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      setSavingRole(true);
      await axiosInstance.put(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      setEditingUserId(null);
      setTemporarySuccess(`User role updated to ${newRole}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedUserIds.size === 0) return;
    try {
      setBulkSaving(true);
      await Promise.all(
        Array.from(selectedUserIds).map((id) =>
          axiosInstance.put(`${API_ENDPOINTS.ADMIN_USERS}/${id}/role`, { role: bulkRole })
        )
      );
      setUsers(prev => prev.map(u => (selectedUserIds.has(u.id) ? { ...u, role: bulkRole } : u)));
      setTemporarySuccess(`Updated ${selectedUserIds.size} user(s) to ${bulkRole}`);
      setSelectedUserIds(new Set());
      setBulkMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed bulk role update');
    } finally {
      setBulkSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const data = users.filter((u) => {
      const matchesSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    data.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        cmp = (a[sortBy] || '').localeCompare(b[sortBy] || '');
      }
      return sortAsc ? cmp : -cmp;
    });

    return data;
  }, [users, searchQuery, roleFilter, sortBy, sortAsc]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUserIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    agents: users.filter(u => u.role === 'SUPPORT_AGENT').length,
    users: users.filter(u => u.role === 'USER').length
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'SUPPORT_AGENT':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
      default:
        return 'bg-surface-100 text-surface-700';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'SUPPORT_AGENT':
        return <Users className="w-4 h-4" />;
      case 'USER':
      default:
        return <User className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground mt-1">Manage users, roles, and team access quickly.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-3 py-2 rounded-lg border border-border/50 hover:bg-card/50 text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold mt-1 text-red-500">{stats.admins}</p>
        </div>
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Support Agents</p>
          <p className="text-2xl font-bold mt-1 text-blue-500">{stats.agents}</p>
        </div>
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <p className="text-xs text-muted-foreground">End Users</p>
          <p className="text-2xl font-bold mt-1">{stats.users}</p>
        </div>
      </div>

      <div className="p-4 border border-border/50 rounded-lg bg-card/30 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 border border-border/50 rounded-lg bg-background"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-3 py-2 border border-border/50 rounded-lg bg-background"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPPORT_AGENT">Support Agents</option>
            <option value="USER">Users</option>
          </select>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="flex-1 px-3 py-2 border border-border/50 rounded-lg bg-background"
            >
              <option value="createdAt">Joined Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-3 py-2 border border-border/50 rounded-lg hover:bg-card/50 text-sm"
              title="Toggle sort direction"
            >
              {sortAsc ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedUserIds(new Set());
            }}
            className="px-3 py-2 rounded-lg border border-border/50 hover:bg-card/50 text-sm"
          >
            {bulkMode ? 'Cancel Bulk Mode' : 'Enable Bulk Role Update'}
          </button>
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length}
          </p>
        </div>

        {bulkMode && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex flex-wrap items-center gap-2">
            <button onClick={toggleSelectAll} className="px-3 py-1.5 rounded border border-border/50 hover:bg-background text-sm flex items-center gap-2">
              {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value as Role)}
              className="px-3 py-2 border border-border/50 rounded-lg bg-background text-sm"
            >
              {roleOptions.map(r => (
                <option key={r} value={r}>{r === 'SUPPORT_AGENT' ? 'Support Agent' : r}</option>
              ))}
            </select>
            <button
              onClick={handleBulkRoleUpdate}
              disabled={selectedUserIds.size === 0 || bulkSaving}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {bulkSaving ? 'Applying...' : `Apply to ${selectedUserIds.size} user(s)`}
            </button>
          </div>
        )}
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-card/50 border-b border-border/50">
            <tr>
              {bulkMode && <th className="px-4 py-3 w-12"></th>}
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                {bulkMode && (
                  <td className="px-4 py-4">
                    <button onClick={() => toggleSelect(u.id)}>
                      {selectedUserIds.has(u.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {u.picture ? (
                      <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium text-foreground">{u.name || 'Unnamed User'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {u.email}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingUserId === u.id ? (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as Role)}
                      className="px-3 py-1 border border-border/50 rounded bg-background text-foreground text-sm"
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r === 'SUPPORT_AGENT' ? 'Support Agent' : r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(u.role)}`}>
                      {getRoleIcon(u.role)}
                      {u.role === 'SUPPORT_AGENT' ? 'Support Agent' : u.role}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingUserId === u.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleUpdateRole(u.id)}
                        disabled={savingRole}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 disabled:opacity-50"
                      >
                        {savingRole ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="px-3 py-1 bg-muted text-foreground rounded text-sm hover:bg-muted/80"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUserId(u.id);
                        setNewRole(u.role);
                      }}
                      className="p-2 hover:bg-primary/10 rounded text-primary transition-colors"
                      title="Edit role"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
