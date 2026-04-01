import { useEffect, useState } from 'react';
import axios from 'axios';
import { Database, Plus, MessageSquare, Files, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [kbs, setKbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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

  useEffect(() => {
    fetchKBs();
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

      {loading ? (
        <div className="loading-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton glass" style={{height: '200px'}}></div>)}
        </div>
      ) : (
        <div className="grid-main">
          {kbs.map((kb) => (
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
