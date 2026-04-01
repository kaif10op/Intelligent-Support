import { useEffect, useState } from 'react';
import axios from 'axios';
import { Database, Plus, MessageSquare, Files, ArrowRight, Trash2, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [kbs, setKbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketStats, setTicketStats] = useState({ open: 0, inProgress: 0, resolved: 0 });

  const fetchKBs = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/kb');
      setKbs(res.data);
      setLoading(false);
    } catch (err) {

      console.error(err);
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/tickets/my', { withCredentials: true });
      if (res.data) {
        setTickets(res.data);
        // Calculate stats
        const stats = {
          open: res.data.filter((t: any) => t.status === 'OPEN').length,
          inProgress: res.data.filter((t: any) => t.status === 'IN_PROGRESS').length,
          resolved: res.data.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length
        };
        setTicketStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  useEffect(() => {
    fetchKBs();
    fetchTickets();
  }, []);

  const handleCreate = async () => {
    if (!newTitle) return;
    try {
      await axios.post('http://localhost:8000/api/kb', { title: newTitle });
      setNewTitle('');
      setShowModal(false);
      fetchKBs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/kb/${id}`);
      fetchKBs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-page fade-in">
      <header className="dashboard-header">
        <div>
          <h1>User Dashboard</h1>
          <p>Welcome back! You have {kbs.length} active knowledge bases.</p>
        </div>
        <button className="btn-glow flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>New Knowledge Base</span>
        </button>
      </header>

      {/* Ticket Summary Section */}
      {tickets.length > 0 && (
        <div className="ticket-summary-section">
          <h3>Your Tickets</h3>
          <div className="ticket-stats-grid">
            <Link to="/tickets" className="ticket-stat-card glass open">
              <div className="stat-icon">
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{ticketStats.open}</div>
                <div className="stat-label">Open</div>
              </div>
            </Link>
            <Link to="/tickets" className="ticket-stat-card glass in-progress">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{ticketStats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </Link>
            <Link to="/tickets" className="ticket-stat-card glass resolved">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{ticketStats.resolved}</div>
                <div className="stat-label">Resolved</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-input-wrap glass">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search knowledge bases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton glass" style={{height: '200px'}}></div>)}
        </div>
      ) : (
        <div className="grid-main">
          {kbs
            .filter(kb => kb.title.toLowerCase().includes(searchTerm.toLowerCase()) || kb.description?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((kb) => (
            <div key={kb.id} className="kb-card glass">
              <div className="card-header">
                <div className="icon-wrap">
                  <Database size={24} color="#8a2be2" />
                </div>
                <button onClick={() => handleDelete(kb.id)} className="delete-btn">
                  <Trash2 size={18} />
                </button>
              </div>

              <h3>{kb.title}</h3>
              <p>{kb.description || 'No description provided.'}</p>

              <div className="card-stats">
                <div className="stat">
                  <Files size={16} />
                  <span>{kb._count?.documents || 0} Docs</span>
                </div>
                <div className="stat">
                  <MessageSquare size={16} />
                  <span>{kb._count?.chats || 0} Chats</span>
                </div>
              </div>

              <div className="card-actions">
                <Link to={`/kb/${kb.id}`} className="secondary-btn">Manage Docs</Link>
                <Link to={`/chat/new?kbId=${kb.id}`} className="primary-link">
                  <span>Chat now</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
          {kbs.filter(kb => kb.title.toLowerCase().includes(searchTerm.toLowerCase()) || kb.description?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="empty-state">
              <Database size={32} opacity={0.5} />
              <p>No knowledge bases found.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass fade-in">
            <h2>Create Knowledge Base</h2>
            <p>Give your knowledge base a name to start uploading documents.</p>
            <input 
              type="text" 
              placeholder="e.g. My Website Docs" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)} 
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleCreate} className="btn-glow">Create KB</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; border-bottom: 1px solid var(--glass-border); padding-bottom: 24px; }

        .ticket-summary-section { margin-bottom: 40px; }
        .ticket-summary-section h3 { color: #fff; margin-bottom: 16px; font-size: 1.1rem; font-weight: 600; }
        .ticket-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .ticket-stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 16px; cursor: pointer; transition: 0.3s; text-decoration: none; border: 1px solid var(--glass-border); }
        .ticket-stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
        .ticket-stat-card.open { border-left: 3px solid #ff6464; }
        .ticket-stat-card.in-progress { border-left: 3px solid #ffa500; }
        .ticket-stat-card.resolved { border-left: 3px solid #4ade80; }
        .stat-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; }
        .ticket-stat-card.open .stat-icon { color: #ff6464; }
        .ticket-stat-card.in-progress .stat-icon { color: #ffa500; }
        .ticket-stat-card.resolved .stat-icon { color: #4ade80; }
        .stat-content { display: flex; flex-direction: column; gap: 4px; }
        .stat-number { font-size: 1.8rem; font-weight: 700; color: #fff; }
        .stat-label { font-size: 0.85rem; color: var(--text-muted); }

        .search-section { margin-bottom: 32px; }
        .search-input-wrap { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-radius: 28px; border: 1px solid var(--glass-border); width: 100%; max-width: 400px; }
        .search-input-wrap input { flex: 1; background: none; border: none; color: #fff; font-size: 1rem; outline: none; }
        .search-input-wrap input::placeholder { color: var(--text-muted); }

        .kb-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; min-height: 240px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; }
        .icon-wrap { width: 44px; height: 44px; background: rgba(138, 43, 226, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .delete-btn { color: var(--text-muted); background: none; border: none; cursor: pointer; transition: color 0.2s; }
        .delete-btn:hover { color: #ff4b4b; }
        .card-stats { display: flex; gap: 16px; margin: 8px 0; }
        .stat { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-muted); }
        .card-actions { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--glass-border); }
        .primary-link { display: flex; align-items: center; gap: 8px; color: var(--accent-primary); text-decoration: none; font-weight: 600; }
        .secondary-btn { font-size: 0.9rem; color: var(--text-muted); text-decoration: none; }
        .secondary-btn:hover { color: #fff; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 20px; color: var(--text-muted); text-align: center; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { max-width: 450px; width: 100%; padding: 32px; display: flex; flex-direction: column; gap: 16px; }
        .modal-buttons { display: flex; justify-content: flex-end; gap: 16px; margin-top: 24px; }
        .btn-cancel { background: none; border: none; color: var(--text-muted); cursor: pointer; font-weight: 600; }
        .skeleton { width: 100%; height: 200px; border-radius: 16px; position: relative; overflow: hidden; background: rgba(255,255,255,0.02); }
        .skeleton::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: loading 1.5s infinite; }
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
