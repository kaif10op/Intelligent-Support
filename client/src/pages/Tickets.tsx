import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Plus, Search, Filter, Clock, AlertCircle, MessageSquare, CheckCircle, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';

const Tickets = () => {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    try {
      const endpoint = user?.role === 'ADMIN' ? 'http://localhost:8000/api/tickets/all' : 'http://localhost:8000/api/tickets/my';
      const res = await axios.get(endpoint);
      setTickets(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch tickets error:', err);
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/tickets', newTicket);
      setShowCreateModal(false);
      setNewTicket({ title: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
    } catch (err) {
      console.error('Create ticket error:', err);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await axios.put(`http://localhost:8000/api/tickets/${ticketId}`, { status });
      fetchTickets();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const statusMatch = filterStatus === 'ALL' || t.status === filterStatus;
    const priorityMatch = filterPriority === 'ALL' || t.priority === filterPriority;
    const searchMatch = searchTerm === '' ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.includes(searchTerm);
    return statusMatch && priorityMatch && searchMatch;
  });

  if (loading) return (
    <div className="loading-state">
      <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
      <p>Loading your support tickets...</p>
    </div>
  );

  return (
    <div className="tickets-page fade-in">
      <header className="page-header">
        <div className="header-content">
          <Ticket size={32} color="#00d2ff" />
          <div>
            <h1>Support Tickets</h1>
            <p>Manage and track your inquiries and escalations.</p>
          </div>
        </div>
        {user?.role !== 'ADMIN' && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Create New Ticket</span>
          </button>
        )}
      </header>

      <div className="tickets-controls glass">
        <div className="search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets by title, description or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <Filter size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="filter-wrap">
          <Filter size={18} />
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div className="tickets-grid">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="ticket-card glass">
            <div className="ticket-header">
              <span className={`priority-badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
              <span className={`status-badge ${ticket.status.toLowerCase().replace('_', '-')}`}>{ticket.status}</span>
            </div>
            <h3>{ticket.title}</h3>
            <p className="ticket-desc">{ticket.description}</p>
            <div className="ticket-footer">
              <div className="meta-info">
                <Clock size={14} />
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="meta-info">
                <User size={14} />
                <span>{ticket.user?.name || 'You'}</span>
              </div>
              {user?.role === 'ADMIN' && ticket.status === 'OPEN' && (
                <button className="btn-action" onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}>
                  <MessageSquare size={16} />
                  Handle
                </button>
              )}
               {user?.role === 'ADMIN' && ticket.status === 'IN_PROGRESS' && (
                <button className="btn-action success" onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}>
                  <CheckCircle size={16} />
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="empty-state glass">
            <AlertCircle size={48} color="var(--text-muted)" />
            <p>No tickets found for the selected filter.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass fade-in">
            <h2>Create New Support Ticket</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>Ticket Title</label>
                <input 
                  type="text" 
                  value={newTicket.title} 
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder="Summarize your issue"
                  required
                />
              </div>
              <div className="form-group">
                <label>Detailed Description</label>
                <textarea 
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Describe the problem or question in detail"
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={newTicket.priority} 
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tickets-page { display: flex; flex-direction: column; gap: 32px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .header-content { display: flex; align-items: center; gap: 16px; }
        .header-content h1 { font-size: 1.8rem; }
        .tickets-controls { display: flex; gap: 24px; padding: 16px 24px; border-radius: 12px; }
        .search-wrap, .filter-wrap { display: flex; align-items: center; gap: 12px; flex: 1; }
        .tickets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        .ticket-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: 0.3s; }
        .ticket-card:hover { transform: translateY(-4px); border-color: var(--accent-primary); }
        .ticket-header { display: flex; justify-content: space-between; }
        .priority-badge { font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
        .priority-badge.urgent { background: rgba(255, 0, 0, 0.1); color: #ff4d4d; }
        .priority-badge.high { background: rgba(255, 127, 0, 0.1); color: #ff7f00; }
        .priority-badge.medium { background: rgba(0, 210, 255, 0.1); color: #00d2ff; }
        .priority-badge.low { background: rgba(138, 43, 226, 0.1); color: #8a2be2; }
        .status-badge { font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; }
        .status-badge.open { border: 1px solid #00ff80; color: #00ff80; }
        .status-badge.in-progress { border: 1px solid #ffcc00; color: #ffcc00; }
        .status-badge.resolved { border: 1px solid #8a2be2; color: #8a2be2; opacity: 0.7; }
        .ticket-desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .ticket-footer { display: flex; gap: 16px; align-items: center; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
        .meta-info { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); }
        .loading-state, .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 100px 0; color: var(--text-muted); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { width: 100%; max-width: 500px; padding: 32px; border-radius: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; }
      `}</style>
    </div>
  );
};

export default Tickets;
