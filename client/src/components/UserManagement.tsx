import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../config/api';
import { Shield, User, Users, Mail, Edit2 } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'ADMIN' | 'SUPPORT_AGENT' | 'USER';
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'ADMIN' | 'SUPPORT_AGENT' | 'USER'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN_USERS);
      setUsers(response.data.users);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      await axiosInstance.put(
        `${API_ENDPOINTS.ADMIN_USERS}/${userId}/role`,
        { role: newRole }
      );

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess(`User role updated to ${newRole}`);
      setEditingUserId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'SUPPORT_AGENT':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'SUPPORT_AGENT':
        return <Users className="w-4 h-4" />;
      case 'USER':
        return <User className="w-4 h-4" />;
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
      </div>

      {/* Alerts */}
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

      {/* Users Table */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-card/50 border-b border-border/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Joined</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium text-foreground">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  {editingUserId === user.id ? (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="px-3 py-1 border border-border/50 rounded bg-background text-foreground text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="SUPPORT_AGENT">Support Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit text-sm font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role === 'SUPPORT_AGENT' ? 'Support Agent' : user.role}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingUserId === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateRole(user.id)}
                          className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="px-3 py-1 bg-muted text-foreground rounded text-sm hover:bg-muted/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingUserId(user.id);
                          setNewRole(user.role);
                        }}
                        className="p-2 hover:bg-primary/10 rounded text-primary transition-colors"
                        title="Edit role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary/50" />
          </div>
        </div>
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{users.filter(u => u.role === 'ADMIN').length}</p>
            </div>
            <Shield className="w-8 h-8 text-red-500/50" />
          </div>
        </div>
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Support Agents</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">{users.filter(u => u.role === 'SUPPORT_AGENT').length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500/50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
