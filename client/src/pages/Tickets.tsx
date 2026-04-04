import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ticket, Plus, Clock, AlertCircle, MessageSquare, CheckCircle, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import { Button, Card, Input, Select, Badge, Modal } from '../components/ui';

const Tickets = () => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
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
      const endpoint = user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT' ? apiUrl('/api/tickets/all') : apiUrl('/api/tickets/my');
      const res = await axios.get(endpoint, axiosConfig);
      const data = Array.isArray(res.data) ? res.data : res.data.tickets || res.data.data || [];
      setTickets(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load tickets';
      addToast(errorMsg, 'error');
      setTickets([]);
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API_ENDPOINTS.TICKET_CREATE, newTicket, axiosConfig);
      setShowCreateModal(false);
      setNewTicket({ title: '', description: '', priority: 'MEDIUM' });
      addToast('Ticket created successfully!', 'success');
      fetchTickets();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create ticket';
      addToast(errorMsg, 'error');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await axios.put(API_ENDPOINTS.TICKET_UPDATE(ticketId), { status }, axiosConfig);
      addToast(`Ticket status updated to ${status}`, 'success');
      fetchTickets();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update ticket status';
      addToast(errorMsg, 'error');
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

  const getPriorityVariant = (priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      case 'RESOLVED': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-surface-200 bg-surface-50">
          <div className="px-6 py-6">
            <div className="h-8 bg-surface-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-surface-200 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
        <div className="px-6 py-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 h-48 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-surface-200 rounded w-2/3"></div>
                  <div className="h-4 bg-surface-200 rounded w-full"></div>
                  <div className="h-4 bg-surface-200 rounded w-4/5"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <Ticket className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="heading-1">Support Tickets</h1>
              <p className="text-surface-600 mt-1">Manage and track your inquiries and escalations</p>
            </div>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Ticket
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Filters */}
        <Card elevated className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MessageSquare className="w-4 h-4" />}
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
              label="Status"
            />
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              label="Priority"
            />
          </div>
        </Card>

        {/* Tickets Grid */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map(ticket => (
              <Card elevated interactive key={ticket.id} className="p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={getPriorityVariant(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-100">
                    {getStatusIcon(ticket.status)}
                    <span className="text-xs font-medium text-surface-900">{ticket.status}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-surface-900 mb-2 line-clamp-2">{ticket.title}</h3>

                {/* Description */}
                <p className="text-sm text-surface-600 mb-4 line-clamp-3 flex-1">
                  {ticket.description}
                </p>

                {/* Footer */}
                <div className="space-y-3 border-t border-surface-200 pt-4">
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-surface-600">
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
                    {(user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT') && ticket.status === 'OPEN' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<MessageSquare className="w-3.5 h-3.5" />}
                        fullWidth
                        onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                      >
                        Handle
                      </Button>
                    )}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT') && ticket.status === 'IN_PROGRESS' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                        fullWidth
                        onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card elevated className="py-16 text-center">
            <AlertCircle className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-600 mb-2">No tickets found</p>
            <p className="text-sm text-surface-500">
              {searchTerm || filterStatus !== 'ALL' || filterPriority !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Create a new ticket to get started'}
            </p>
          </Card>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Ticket"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTicket}
            >
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-surface-600 text-sm">Submit a new support request</p>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <Input
              label="Ticket Title"
              type="text"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              placeholder="Summarize your issue"
              required
            />

            <div className="space-y-2">
              <label className="label">Description</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Describe the problem or question in detail"
                className="input w-full resize-none min-h-24"
                required
              />
            </div>

            <Select
              label="Priority"
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Tickets;
