import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Database, Shield, Zap, TrendingUp, Search, Filter, BarChart as BarIcon, PieChart as PieIcon, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const Admin = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateTicket = async (ticketId: string, status: string) => {
    try {
      await axios.put(`http://localhost:8000/api/tickets/${ticketId}`, { status });
      fetchAdminData();
    } catch (err) {
      console.error('Update ticket error:', err);
    }
  };

  const COLORS = ['#8a2be2', '#00d2ff', '#00ff80', '#ff4d4d', '#ffcc00'];

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
            <Zap size={24} color="#00ff80" />
          </div>
          <div className="stat-info">
            <h3>Total Tickets</h3>
            <span>{stats?.totalTickets || 0}</span>
          </div>
          <Activity size={20} color="#8a2be2" />
        </div>
      </div>

      <div className="analytics-row">
         <div className="chart-card glass">
            <div className="chart-header">
               <BarIcon size={18} color="var(--accent-primary)" />
               <h3>AI Confidence Distribution</h3>
            </div>
            <div className="chart-container">
               <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.confidenceDist}>
                     <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                     <YAxis stroke="var(--text-muted)" fontSize={12} />
                     <Tooltip 
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
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

         <div className="chart-card glass">
            <div className="chart-header">
               <PieIcon size={18} color="var(--accent-secondary)" />
               <h3>User Feedback Quality</h3>
            </div>
            <div className="chart-container">
               <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                     <Pie
                        data={stats?.feedbackStats}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {stats?.feedbackStats?.map((_entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={COLORS[(index+1) % COLORS.length]} />
                        ))}
                     </Pie>

                     <Tooltip 
                         contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                     />
                     <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
               </ResponsiveContainer>
            </div>
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

      <section className="ticket-management glass">
        <div className="section-header">
          <h2>Ticket Management</h2>
          <div className="filter-box">
             <Filter size={18} />
             <span>Recent Tickets</span>
          </div>
        </div>

        <div className="tickets-list">
          {stats?.tickets?.map((ticket: any) => (
            <div key={ticket.id} className="admin-ticket-row glass">
              <div className="ticket-main">
                <span className={`p-badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                <div className="ticket-text">
                  <h4>{ticket.title}</h4>
                  <p>from <strong>{ticket.user?.email}</strong></p>
                </div>
              </div>
              <div className="ticket-status-actions">
                <span className={`s-badge ${ticket.status.toLowerCase().replace('_', '-')}`}>{ticket.status}</span>
                {ticket.status === 'OPEN' && (
                  <button className="btn-s" onClick={() => handleUpdateTicket(ticket.id, 'IN_PROGRESS')}>Handle</button>
                )}
                {ticket.status === 'IN_PROGRESS' && (
                   <button className="btn-s success" onClick={() => handleUpdateTicket(ticket.id, 'RESOLVED')}>Resolve</button>
                )}
              </div>
            </div>
          ))}
          {(!stats?.tickets || stats.tickets.length === 0) && (
            <p className="empty-hint">No active tickets to manage.</p>
          )}
        </div>
      </section>

      <style>{`
        .admin-page { display: flex; flex-direction: column; gap: 48px; padding-bottom: 50px; }
        .admin-header h1 { font-size: 2.2rem; }
        .header-info { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .stat-card { padding: 32px; display: flex; align-items: center; gap: 24px; position: relative; }
        .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .stat-info h3 { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 4px; }
        .stat-info span { font-size: 1.8rem; font-weight: 700; color: #fff; }
        .stat-card svg:last-child { position: absolute; top: 32px; right: 32px; opacity: 0.6; }
        .user-management, .ticket-management { padding: 32px; border-radius: 24px; }
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
        
        .tickets-list { display: flex; flex-direction: column; gap: 16px; }
        .admin-ticket-row { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
        .ticket-main { display: flex; align-items: center; gap: 20px; }
        .p-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05); }
        .p-badge.urgent { color: #ff4d4d; border: 1px solid #ff4d4d; }
        .p-badge.high { color: #ff7f00; border: 1px solid #ff7f00; }
        .p-badge.medium { color: #00d2ff; border: 1px solid #00d2ff; }
        .p-badge.low { color: #8a2be2; border: 1px solid #8a2be2; }
        .ticket-text h4 { margin: 0 0 4px 0; font-size: 1rem; color: #fff; }
        .ticket-text p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }
        .ticket-status-actions { display: flex; align-items: center; gap: 16px; }
        .s-badge { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
        .s-badge.open { background: rgba(0, 255, 128, 0.1); color: #00ff80; }
        .s-badge.in-progress { background: rgba(255, 204, 0, 0.1); color: #ffcc00; }
        .s-badge.resolved { background: rgba(138, 43, 226, 0.1); color: #8a2be2; }
        .btn-s { background: var(--accent-primary); border: none; color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
        .btn-s.success { background: #00ff80; color: #000; }
        .filter-box { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.85rem; }
      `}</style>

    </div>
  );
};

export default Admin;
