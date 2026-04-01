import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Database, FileText, Activity, Shield, Zap, TrendingUp, Search } from 'lucide-react';

const Admin = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/api/admin/stats'),
          axios.get('http://localhost:8000/api/admin/users')
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading admin analytics...</div>;

  return (
    <div className="admin-page fade-in">
      <header className="admin-header">
        <div className="header-info">
          <Shield size={32} color="#00d2ff" />
          <h1>Admin Command Center</h1>
        </div>
        <p>Global platform overview and user management.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon" style={{background: 'rgba(138, 43, 226, 0.1)'}}>
            <Users size={24} color="#8a2be2" />
          </div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <span>{stats?.totalUsers || 0}</span>
          </div>
          <TrendingUp size={20} color="#00ff80" />
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{background: 'rgba(0, 210, 255, 0.1)'}}>
            <Database size={24} color="#00d2ff" />
          </div>
          <div className="stat-info">
            <h3>Knowledge Bases</h3>
            <span>{stats?.totalKBs || 0}</span>
          </div>
          <Zap size={20} color="#ff0080" />
        </div>

        <div className="stat-card glass">
          <div className="stat-icon" style={{background: 'rgba(0, 255, 128, 0.1)'}}>
            <FileText size={24} color="#00ff80" />
          </div>
          <div className="stat-info">
            <h3>Total Documents</h3>
            <span>{stats?.totalDocs || 0}</span>
          </div>
          <Activity size={20} color="#8a2be2" />
        </div>
      </div>

      <section className="user-management glass">
        <div className="section-header">
          <h2>User Management</h2>
          <div className="search-box glass">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>KBs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      {user.picture ? <img src={user.picture} alt="" /> : <div className="p-icon"><Users size={14}/></div>}
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>{user._count?.knowledgeBases || 0}</td>
                  <td><span className="status-dot active"></span> Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .admin-page { display: flex; flex-direction: column; gap: 48px; }
        .admin-header h1 { font-size: 2.2rem; }
        .header-info { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .stat-card { padding: 32px; display: flex; align-items: center; gap: 24px; position: relative; }
        .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .stat-info h3 { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 4px; }
        .stat-info span { font-size: 1.8rem; font-weight: 700; color: #fff; }
        .stat-card svg:last-child { position: absolute; top: 32px; right: 32px; opacity: 0.6; }
        .user-management { padding: 32px; border-radius: 24px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .search-box { display: flex; align-items: center; gap: 12px; padding: 10px 20px; border-radius: 12px; max-width: 400px; width: 100%; }
        .search-box input { border: none; background: none; padding: 0; flex: 1; font-size: 0.9rem; }
        .users-table-container { overflow-x: auto; }
        .users-table { width: 100%; border-collapse: collapse; text-align: left; }
        .users-table th { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; padding: 16px; border-bottom: 1px solid var(--glass-border); text-transform: uppercase; letter-spacing: 1px; }
        .users-table td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.03); color: #fff; font-size: 0.95rem; }
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .user-cell img { width: 32px; height: 32px; border-radius: 50%; }
        .p-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
        .role-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
        .role-badge.ADMIN { background: rgba(0, 210, 255, 0.1); color: #00d2ff; }
        .role-badge.USER { background: rgba(255, 255, 255, 0.1); color: var(--text-muted); }
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
        .status-dot.active { background: #00ff80; box-shadow: 0 0 8px #00ff80; }
      `}</style>
    </div>
  );
};

export default Admin;
