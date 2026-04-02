import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Database,
  Plus,
  MessageSquare,
  Files,
  ArrowRight,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

const Dashboard = () => {
  const { addToast } = useToast();
  const [kbs, setKbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketStats, setTicketStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
  });

  const fetchKBs = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/kb', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setKbs(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to load knowledge bases', 'error');
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/tickets/my', { withCredentials: true });
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      if (data.length > 0) {
        setTickets(data);
        const stats = {
          open: data.filter((t: any) => t.status === 'OPEN').length,
          inProgress: data.filter((t: any) => t.status === 'IN_PROGRESS').length,
          resolved: data.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
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
    if (!newTitle.trim()) {
      addToast('Please enter a KB name', 'warning');
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/kb', { title: newTitle }, { withCredentials: true });
      addToast('Knowledge base created successfully!', 'success');
      setNewTitle('');
      setShowModal(false);
      fetchKBs();
    } catch (err: any) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to create KB', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/kb/${id}`, { withCredentials: true });
      addToast('Knowledge base deleted', 'success');
      fetchKBs();
    } catch (err: any) {
      console.error(err);
      addToast('Failed to delete KB', 'error');
    }
  };

  const filteredKbs = kbs.filter(
    (kb) =>
      kb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kb.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage {kbs.length} knowledge base{kbs.length !== 1 ? 's' : ''} and support tickets
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus className="w-5 h-5" />
          New KB
        </button>
      </div>

      {/* Ticket Summary */}
      {tickets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Your Tickets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Open Tickets Card */}
            <Link
              to="/tickets"
              className="glass-elevated p-6 rounded-lg border border-border/50 hover:border-destructive/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <span className="text-2xl font-bold text-destructive">{ticketStats.open}</span>
              </div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-destructive font-medium">
                View all <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* In Progress Tickets Card */}
            <Link
              to="/tickets"
              className="glass-elevated p-6 rounded-lg border border-border/50 hover:border-amber-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-2xl font-bold text-amber-500">{ticketStats.inProgress}</span>
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-amber-500 font-medium">
                View all <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Resolved Tickets Card */}
            <Link
              to="/tickets"
              className="glass-elevated p-6 rounded-lg border border-border/50 hover:border-emerald-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="text-2xl font-bold text-emerald-500">{ticketStats.resolved}</span>
              </div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-500 font-medium">
                View all <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Knowledge Bases Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Knowledge Bases
          </h2>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search KBs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full pl-9"
            />
          </div>
        </div>

        {/* KB Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-elevated p-6 rounded-lg border border-border/50 h-64 animate-pulse"
              >
                <div className="h-4 bg-border/30 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-border/30 rounded w-full"></div>
                  <div className="h-4 bg-border/30 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredKbs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKbs.map((kb) => (
              <div
                key={kb.id}
                className="glass-elevated border border-border/50 rounded-lg p-6 hover:border-primary/30 transition-colors flex flex-col group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <button
                    onClick={() => handleDelete(kb.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{kb.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                  {kb.description || 'No description provided'}
                </p>

                {/* Stats */}
                <div className="flex gap-4 mb-4 text-xs text-muted-foreground border-t border-border/30 pt-4">
                  <div className="flex items-center gap-1.5">
                    <Files className="w-4 h-4" />
                    <span>{kb._count?.documents || 0} docs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>{kb._count?.chats || 0} chats</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/kb/${kb.id}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-border/50 text-sm font-medium text-foreground hover:bg-card/50 transition-colors text-center"
                  >
                    Manage
                  </Link>
                  <Link
                    to={`/chat/new?kbId=${kb.id}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors text-center flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-elevated border border-border/50 rounded-lg p-12 text-center">
            <Database className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No knowledge bases match your search' : 'No knowledge bases yet'}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              {!searchTerm && 'Create your first knowledge base to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Create KB Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-elevated border border-border/50 rounded-lg p-8 w-full max-w-sm animate-fadeIn">
            <h2 className="text-2xl font-bold text-foreground mb-2">Create Knowledge Base</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Enter a name for your new knowledge base
            </p>

            <input
              type="text"
              placeholder="e.g. Product Documentation"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              className="input-base w-full mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewTitle('');
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border/50 text-foreground font-medium hover:bg-card/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
