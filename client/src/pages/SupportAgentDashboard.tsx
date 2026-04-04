import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../config/api';
import { Ticket, AlertCircle, CheckCircle, Clock, Plus, RotateCcw, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, Input, StatCard, NavigationTabs, Badge } from '../components/ui';

type AgentTab = 'all' | 'open' | 'in-progress' | 'resolved';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  userId: string;
  assignedToId?: string;
  user?: { id: string; name: string; email: string };
}

const SupportAgentDashboard = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AgentTab>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      const response = await axiosInstance.get(API_ENDPOINTS.TICKETS_LIST);
      // Handle both response formats: { data, pagination } and direct array
      const allTickets = response.data?.data || response.data?.tickets || response.data || [];
      setTickets(Array.isArray(allTickets) ? allTickets : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const getPriorityVariant = (priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  // Calculate stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
  };

  // Filter and search
  const getFilteredTickets = () => {
    let filtered = tickets;

    // Apply tab filter
    if (activeTab === 'open') filtered = filtered.filter(t => t.status === 'OPEN');
    else if (activeTab === 'in-progress') filtered = filtered.filter(t => t.status === 'IN_PROGRESS');
    else if (activeTab === 'resolved') filtered = filtered.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm)
      );
    }

    // Sort by most recent
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredTickets = getFilteredTickets();

  if (loading) {
    return (
      <div className="space-y-6 min-h-screen flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading support queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50 sticky top-0 z-40">
        <div className="px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <Ticket className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="heading-1">Support Queue</h1>
              <p className="text-surface-600 mt-1">Manage {stats.total} ticket{stats.total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={fetchTickets}
              loading={refreshing}
              disabled={refreshing}
            >
              Refresh
            </Button>
            <Link to="/tickets">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-5 h-5" />}
              >
                New Ticket
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-t border-surface-200">
          <NavigationTabs
            tabs={[
              { id: 'all', label: 'All', icon: <Ticket className="w-4 h-4" /> },
              { id: 'open', label: 'Open', icon: <AlertCircle className="w-4 h-4" /> },
              { id: 'in-progress', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
              { id: 'resolved', label: 'Resolved', icon: <CheckCircle className="w-4 h-4" /> }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} icon={<Ticket className="w-6 h-6" />} />
          <StatCard label="Open" value={stats.open} icon={<AlertCircle className="w-6 h-6" />} />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-6 h-6" />} />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle className="w-6 h-6" />} />
        </div>

        {/* Search */}
        <Card elevated className="p-4">
          <Input
            type="text"
            placeholder="Search tickets by title, description, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <Card elevated className="p-12 text-center">
            <Ticket className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-600 font-medium">
              {searchTerm ? 'No tickets match your search' : `No ${activeTab === 'all' ? '' : activeTab} tickets`}
            </p>
            <p className="text-sm text-surface-500 mt-2">
              {searchTerm
                ? 'Try adjusting your search terms'
                : activeTab === 'all'
                ? 'Create a new ticket to get started'
                : 'No tickets in this category'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets?id=${ticket.id}`}>
                <Card elevated className="p-4 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={getPriorityVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-100 text-xs font-medium text-surface-700">
                          {getStatusIcon(ticket.status)}
                          <span>{ticket.status}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-surface-900 group-hover:text-primary-500 truncate">
                        {ticket.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-surface-600 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>

                      {/* Meta */}
                      <div className="text-xs text-surface-500 mt-2 flex gap-3 flex-wrap">
                        <span>ID: {ticket.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.user && (
                          <>
                            <span>•</span>
                            <span>{ticket.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="text-primary-500 flex-shrink-0">
                      →
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportAgentDashboard;
