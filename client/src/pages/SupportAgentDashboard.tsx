import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../config/api';
import { Ticket, AlertCircle, CheckCircle, Clock, Plus, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  userId: string;
  assignedToId?: string;
}

const SupportAgentDashboard = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.TICKETS_LIST);
      let filtered = response.data.tickets || [];

      if (filter !== 'all') {
        filtered = filtered.filter((t: TicketData) => t.status === filter.toUpperCase());
      }

      setTickets(filtered);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CLOSED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="w-6 h-6" />
            Support Queue
          </h2>
          <p className="text-muted-foreground mt-1">Manage and track support tickets</p>
        </div>
        <Link
          to="/tickets"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Tickets</p>
          <p className="text-2xl font-bold text-foreground mt-2">{stats.total}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Open</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{stats.open}</p>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.inProgress}</p>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Resolved</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats.resolved}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              filter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading tickets...</div>
        </div>
      )}

      {/* Tickets List */}
      {!loading && tickets.length === 0 && (
        <div className="p-8 text-center border border-dashed border-border/50 rounded-lg">
          <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No tickets found</p>
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="p-4 border border-border/50 rounded-lg hover:bg-card/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary truncate transition-colors">
                    {ticket.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                  <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs whitespace-nowrap">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportAgentDashboard;
