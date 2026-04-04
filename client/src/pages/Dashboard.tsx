import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Database,
  Plus,
  MessageSquare,
  Files,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import { Button, Card, Input, Modal, StatCard } from '../components/ui';

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
      const res = await axios.get(API_ENDPOINTS.KB_LIST, axiosConfig);
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
      const res = await axios.get(apiUrl('/api/tickets/my'), axiosConfig);
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
      await axios.post(API_ENDPOINTS.KB_CREATE, { title: newTitle }, axiosConfig);
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
      await axios.delete(API_ENDPOINTS.KB_DELETE(id), axiosConfig);
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
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="heading-1">Dashboard</h1>
            <p className="text-surface-600 mt-1">
              Manage {kbs.length} knowledge base{kbs.length !== 1 ? 's' : ''} and support tickets
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowModal(true)}
          >
            New KB
          </Button>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-6 py-6 space-y-8">

        {/* Ticket Summary */}
        {tickets.length > 0 && (
          <div className="space-y-4">
            <h2 className="heading-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent-500" />
              Your Tickets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/tickets">
                <StatCard
                  label="Open Tickets"
                  value={ticketStats.open}
                  icon={<AlertCircle className="w-8 h-8" />}
                  trend={ticketStats.open > 0 ? { direction: 'down', value: 5 } : undefined}
                />
              </Link>
              <Link to="/tickets">
                <StatCard
                  label="In Progress"
                  value={ticketStats.inProgress}
                  icon={<Clock className="w-8 h-8" />}
                  trend={ticketStats.inProgress > 0 ? { direction: 'up', value: 2 } : undefined}
                />
              </Link>
              <Link to="/tickets">
                <StatCard
                  label="Resolved"
                  value={ticketStats.resolved}
                  icon={<CheckCircle className="w-8 h-8" />}
                  trend={ticketStats.resolved > 0 ? { direction: 'up', value: 12 } : undefined}
                />
              </Link>
            </div>
          </div>
        )}

        {/* Knowledge Bases Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="heading-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-500" />
              Knowledge Bases
            </h2>
            <Input
              type="text"
              placeholder="Search knowledge bases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="w-full sm:w-64"
            />
          </div>

          {/* KB Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 h-64 animate-pulse">
                  <div className="h-4 bg-surface-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-surface-200 rounded w-full"></div>
                    <div className="h-4 bg-surface-200 rounded w-5/6"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredKbs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKbs.map((kb) => (
                <Card elevated key={kb.id} interactive className="p-6 flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Database className="w-6 h-6 text-primary-500" />
                    </div>
                    <button
                      onClick={() => handleDelete(kb.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-surface-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-surface-900 mb-1 line-clamp-2">{kb.title}</h3>
                  <p className="text-sm text-surface-600 mb-4 line-clamp-2 flex-1">
                    {kb.description || 'No description provided'}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4 text-xs text-surface-600 border-t border-surface-200 pt-4">
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
                    <Link to={`/kb/${kb.id}`} className="flex-1">
                      <Button variant="outline" fullWidth size="sm">
                        Manage
                      </Button>
                    </Link>
                    <Link to={`/chat/new?kbId=${kb.id}`} className="flex-1">
                      <Button variant="primary" icon={<Sparkles className="w-4 h-4" />} fullWidth size="sm">
                        Chat
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card elevated className="p-12 text-center">
              <Database className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-600">
                {searchTerm ? 'No knowledge bases match your search' : 'No knowledge bases yet'}
              </p>
              <p className="text-sm text-surface-500 mt-2">
                {!searchTerm && 'Create your first knowledge base to get started'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create KB Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewTitle('');
        }}
        title="Create Knowledge Base"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setNewTitle('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-surface-600">Enter a name for your new knowledge base</p>
          <Input
            type="text"
            placeholder="e.g. Product Documentation"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
