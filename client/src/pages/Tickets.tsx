import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Plus, Search, Filter, Clock, AlertCircle, MessageSquare, CheckCircle, User, Loader2, X } from 'lucide-react';
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
      await axios.post('http://localhost:8000/api/tickets', newTicket, { withCredentials: true });
      setShowCreateModal(false);
      setNewTicket({ title: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
    } catch (err) {
      console.error('Create ticket error:', err);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await axios.put(`http://localhost:8000/api/tickets/${ticketId}`, { status }, { withCredentials: true });
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'LOW': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Ticket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage and track your inquiries and escalations</p>
          </div>
        </div>
        {user?.role !== 'ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-elevated p-4 space-y-4 sm:space-y-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base w-full pl-9"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-base w-full appearance-none pr-10 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="input-base w-full appearance-none pr-10 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className="glass-elevated border border-border/50 rounded-lg p-6 hover:border-primary/30 transition-all hover:shadow-lg flex flex-col group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-card/50">
                  {getStatusIcon(ticket.status)}
                  <span className="text-xs font-medium text-foreground">{ticket.status}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{ticket.title}</h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                {ticket.description}
              </p>

              {/* Footer */}
              <div className="space-y-3 border-t border-border/30 pt-4">
                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  {ticket.user && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[100px]">{ticket.user.name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {user?.role === 'ADMIN' && ticket.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Handle
                    </button>
                  )}
                  {user?.role === 'ADMIN' && ticket.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-elevated border border-border/50 rounded-lg py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No tickets found</p>
          <p className="text-sm text-muted-foreground/70">
            {searchTerm || filterStatus !== 'ALL' || filterPriority !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create a new ticket to get started'}
          </p>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-elevated border border-border/50 rounded-lg p-8 w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create Ticket</h2>
                <p className="text-muted-foreground text-sm mt-1">Submit a new support request</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-card/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ticket Title</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Summarize your issue"
                  className="input-base w-full"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Describe the problem or question in detail"
                  className="input-base w-full resize-none min-h-24"
                  required
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="input-base w-full appearance-none pr-10 cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border/50 text-foreground font-medium hover:bg-card/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
