import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ticket, Plus, Clock, AlertCircle, CheckCircle, User, Loader2, RotateCcw, Zap, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import { Button, Card, Input, Select, Badge, Modal, StatCard, NavigationTabs } from '../components/ui';

type TicketTab = 'all' | 'open' | 'in-progress' | 'resolved';

const Tickets = () => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TicketTab>('all');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [ticketAiMode, setTicketAiMode] = useState('draft_ticket');
  const [ticketAiLoading, setTicketAiLoading] = useState(false);
  const [ticketAiResult, setTicketAiResult] = useState('');
  const [ticketAiPackLoading, setTicketAiPackLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'oldest'>('recent');

  // Admin assignment state
  const [supportAgents, setSupportAgents] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [startingChatTicketId, setStartingChatTicketId] = useState<string | null>(null);
  const isSupportStaff = user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT';

  useEffect(() => {
    fetchTickets();
    if (user?.role === 'ADMIN') {
      fetchSupportAgents();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      // Use /api/tickets/all only for admins, else use /api/tickets
      const endpoint = user?.role === 'ADMIN' ? apiUrl('/api/tickets/all') : apiUrl('/api/tickets');
      const res = await axios.get(`${endpoint}?limit=30`, axiosConfig);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.tickets || [];
      setTickets(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load tickets';
      addToast(errorMsg, 'error');
      setTickets([]);
      setLoading(false);
    } finally {
      setRefreshing(false);
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

  const handleGenerateTicketWithAI = async () => {
    try {
      setTicketAiLoading(true);
      const context = `${newTicket.title}\n${newTicket.description}`.trim();
      const res = await axios.post(
        API_ENDPOINTS.TICKET_AI_COPILOT,
        { flow: 'ticket_creation', mode: ticketAiMode, context },
        axiosConfig
      );
      const suggestion = res.data?.suggestion || '';
      const draft = res.data?.draft;

      if (draft) {
        setNewTicket((prev) => ({
          ...prev,
          title: draft.title || prev.title,
          description: draft.description || prev.description,
          priority: draft.priority || prev.priority
        }));
      }
      setTicketAiResult(suggestion || 'Draft generated.');
      addToast('AI ticket draft generated', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to generate ticket draft', 'error');
    } finally {
      setTicketAiLoading(false);
    }
  };

  const handleRunTicketAIPack = async () => {
    try {
      setTicketAiPackLoading(true);
      const context = `${newTicket.title}\n${newTicket.description}`.trim();
      const packModes = ['draft_ticket', 'priority_recommendation', 'title_improver', 'description_improver'];
      const res = await axios.post(
        API_ENDPOINTS.TICKET_AI_COPILOT,
        { flow: 'ticket_creation', mode: 'draft_ticket', modes: packModes, context },
        axiosConfig
      );
      const draft = res.data?.draft;
      if (draft) {
        setNewTicket((prev) => ({
          ...prev,
          title: draft.title || prev.title,
          description: draft.description || prev.description,
          priority: draft.priority || prev.priority
        }));
      }
      const combined = Array.isArray(res.data?.outputs)
        ? res.data.outputs.map((o: any) => `## ${o.mode}\n${o.suggestion}`).join('\n\n')
        : res.data?.suggestion || 'Draft generated.';
      setTicketAiResult(combined);
      addToast('AI ticket pack completed', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to run AI ticket pack', 'error');
    } finally {
      setTicketAiPackLoading(false);
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

  const fetchSupportAgents = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.TICKET_AGENTS, axiosConfig);
      const users = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.users) ? res.data.users : []);
      const agents = users.filter((u: any) => u.role === 'SUPPORT_AGENT' || u.role === 'ADMIN');
      setSupportAgents(agents);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load support agents';
      addToast(errorMsg, 'error');
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicketForAssign || !selectedAgent) {
      addToast('Please select both ticket and agent', 'error');
      return;
    }

    try {
      await axios.put(
        API_ENDPOINTS.TICKET_UPDATE(selectedTicketForAssign.id),
        { assignedToId: selectedAgent, status: 'IN_PROGRESS' },
        axiosConfig
      );
      addToast('Ticket assigned successfully!', 'success');
      setShowAssignModal(false);
      setSelectedAgent('');
      setSelectedTicketForAssign(null);
      fetchTickets();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to assign ticket';
      addToast(errorMsg, 'error');
    }
  };

  const handleAutoAssign = async () => {
    try {
      setAutoAssigning(true);
      const res = await axios.post(apiUrl('/api/tickets/admin/auto-assign'), {}, axiosConfig);
      addToast(res.data.message || 'Auto-assignment completed!', 'success');
      fetchTickets();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to auto-assign tickets';
      addToast(errorMsg, 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleStartChat = async (ticket: any) => {
    try {
      setStartingChatTicketId(ticket.id);
      const res = await axios.post(apiUrl(`/api/tickets/${ticket.id}/init-chat`), {}, axiosConfig);
      const chatId = res.data?.chat?.id;
      if (chatId) {
        addToast('Support chat started successfully', 'success');
        navigate(`/chat/${chatId}`);
        return;
      }
      addToast('Failed to start chat for this ticket', 'error');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to start chat for this ticket', 'error');
    } finally {
      setStartingChatTicketId(null);
    }
  };


  // Calculate stats
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    urgent: tickets.filter(t => t.priority === 'URGENT').length,
  };

  const getSortedAndFilteredTickets = () => {
    let filtered = tickets.filter(t => {
      const statusMatch = filterStatus === 'ALL' || t.status === filterStatus;
      const priorityMatch = filterPriority === 'ALL' || t.priority === filterPriority;
      const searchMatch = searchTerm === '' ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm);
      return statusMatch && priorityMatch && searchMatch;
    });

    // Apply tab filter
    if (activeTab === 'open') filtered = filtered.filter(t => t.status === 'OPEN');
    else if (activeTab === 'in-progress') filtered = filtered.filter(t => t.status === 'IN_PROGRESS');
    else if (activeTab === 'resolved') filtered = filtered.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === 'urgent') {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      sorted.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 4));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  };

  const filteredTickets = getSortedAndFilteredTickets();

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-40">
        <div className="px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <Ticket className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="heading-1">Support Tickets</h1>
              <p className="text-surface-600 mt-1">Manage {ticketStats.total} ticket{ticketStats.total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {user?.role === 'ADMIN' && (
              <Button
                variant="outline"
                size="md"
                icon={<Zap className="w-4 h-4" />}
                onClick={handleAutoAssign}
                loading={autoAssigning}
                disabled={autoAssigning}
              >
                Auto-Assign
              </Button>
            )}
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
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              New Ticket
            </Button>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total" value={ticketStats.total} icon={<Ticket className="w-6 h-6" />} />
          <StatCard label="Open" value={ticketStats.open} icon={<AlertCircle className="w-6 h-6" />} />
          <StatCard label="In Progress" value={ticketStats.inProgress} icon={<Clock className="w-6 h-6" />} />
          <StatCard label="Resolved" value={ticketStats.resolved} icon={<CheckCircle className="w-6 h-6" />} />
          <StatCard label="Urgent" value={ticketStats.urgent} icon={<AlertCircle className="w-6 h-6" />} />
        </div>

        {/* Filters */}
        <Card elevated className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Ticket className="w-4 h-4" />}
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
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="recent">Sort: Recent</option>
              <option value="urgent">Sort: Urgent</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </Card>

        {/* Tickets Grid */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map(ticket => (
              <Card
                elevated
                className={`p-6 flex flex-col transition-shadow ${isSupportStaff ? 'hover:shadow-md cursor-pointer' : ''}`}
                key={ticket.id}
                onClick={isSupportStaff ? () => navigate(`/ticket/${ticket.id}`) : undefined}
              >
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
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    {ticket.assignedTo && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{ticket.assignedTo.name}</span>
                      </div>
                    )}
                    {ticket.user && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{ticket.user.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {user?.role === 'ADMIN' && !ticket.assignedTo && ticket.status === 'OPEN' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Users className="w-3.5 h-3.5" />}
                          fullWidth
                          onClick={() => {
                            setSelectedTicketForAssign(ticket);
                            setShowAssignModal(true);
                          }}
                        >
                          Assign Agent
                        </Button>
                      )}
                      {isSupportStaff && ticket.status === 'OPEN' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Clock className="w-3.5 h-3.5" />}
                          fullWidth
                          onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                        >
                          Handle
                        </Button>
                      )}
                      {isSupportStaff && ticket.status === 'IN_PROGRESS' && (
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
                    {isSupportStaff && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Zap className="w-3.5 h-3.5" />}
                        fullWidth
                        loading={startingChatTicketId === ticket.id}
                        onClick={() => handleStartChat(ticket)}
                        >
                          Start Chat
                        </Button>
                    )}
                  </div>
                  {!isSupportStaff && (
                    <div className="rounded-lg bg-surface-100 border border-surface-200 px-3 py-2 text-xs text-surface-600">
                      Ticket submitted successfully. A support agent will review the full details and respond here.
                    </div>
                  )}
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
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Ticket Copilot</p>
              <p className="text-xs text-surface-600">Draft better tickets automatically</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                ['draft_ticket', 'Full Draft'],
                ['title_improver', 'Better Title'],
                ['description_improver', 'Better Description'],
                ['priority_recommendation', 'Priority Advice']
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTicketAiMode(value)}
                  className={`px-2 py-1 rounded-md text-xs border ${
                    ticketAiMode === value
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-card border-border text-surface-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleGenerateTicketWithAI} loading={ticketAiLoading}>
                Generate with AI
              </Button>
              <Button type="button" variant="outline" onClick={handleRunTicketAIPack} loading={ticketAiPackLoading}>
                Run Full AI Pack
              </Button>
              {ticketAiResult && (
                <Button type="button" variant="secondary" onClick={() => setTicketAiResult('')}>
                  Clear
                </Button>
              )}
            </div>
            {ticketAiResult && (
              <div className="text-xs text-surface-700 p-2 rounded bg-card border border-border whitespace-pre-wrap">
                {ticketAiResult}
              </div>
            )}
          </div>
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

      {/* Assign Ticket Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedAgent('');
          setSelectedTicketForAssign(null);
        }}
        title="Assign Ticket"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedAgent('');
                setSelectedTicketForAssign(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignTicket}
            >
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-surface-600 text-sm">Select a support agent to assign this ticket</p>
          {selectedTicketForAssign && (
            <div className="p-3 bg-surface-50 rounded-lg border border-surface-200">
              <p className="text-xs text-surface-600 font-medium uppercase tracking-wide mb-1">Ticket</p>
              <p className="font-semibold text-surface-900">{selectedTicketForAssign.title}</p>
            </div>
          )}
          <Select
            label="Support Agent"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            options={[
              { value: '', label: 'Select an agent...' },
              ...supportAgents.map((agent) => ({
                value: agent.id,
                label: agent.name || agent.email
              }))
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Tickets;
