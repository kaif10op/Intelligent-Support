import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ticket, Plus, Clock, AlertCircle, CheckCircle, Search, Columns, LayoutGrid, Play, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import { Button, Card, Input, NavigationTabs, Badge, Select, Modal } from '../components/ui';

type TicketTab = 'all' | 'open' | 'in-progress' | 'resolved';

const Tickets = () => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketAiResult, setTicketAiResult] = useState('');
  const [ticketAiPackLoading, setTicketAiPackLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TicketTab>('all');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [sortBy] = useState<'recent' | 'urgent' | 'oldest'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  // Admin assignment state
  const [supportAgents, setSupportAgents] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [startingChatTicketId, setStartingChatTicketId] = useState<string | null>(null);
  const isSupportStaff = user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT';

  const fetchTickets = useCallback(async () => {
    try {
      const endpoint = user?.role === 'ADMIN' ? apiUrl('/api/tickets/all') : apiUrl('/api/tickets');
      const res = await axios.get(`${endpoint}?limit=50`, axiosConfig);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.tickets || [];
      setTickets(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load tickets';
      addToast(errorMsg, 'error');
      setTickets([]);
      setLoading(false);
    }
  }, [user?.role, addToast]);

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
        : res.data?.suggestion || 'Analysis complete.';
      setTicketAiResult(combined);
      addToast('Smart optimization applied', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Optimization failed', 'error');
    } finally {
      setTicketAiPackLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await axios.put(API_ENDPOINTS.TICKET_UPDATE(ticketId), { status }, axiosConfig);
      addToast(`Ticket marked as ${status.replace('_', ' ').toLowerCase()}`, 'success');
      fetchTickets();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to update ticket status', 'error');
    }
  };

  const fetchSupportAgents = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.TICKET_AGENTS, axiosConfig);
      const users = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.users) ? res.data.users : []);
      const agents = users.filter((u: any) => u.role === 'SUPPORT_AGENT' || u.role === 'ADMIN');
      setSupportAgents(agents);
    } catch (err: any) {
       console.error('Failed to load agents');
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    if (user?.role === 'ADMIN') {
      fetchSupportAgents();
    }
  }, [user?.role, fetchTickets, fetchSupportAgents]);

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
      addToast('Ticket assigned successfully', 'success');
      setShowAssignModal(false);
      setSelectedAgent('');
      setSelectedTicketForAssign(null);
      fetchTickets();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to assign ticket', 'error');
    }
  };

  const handleAutoAssign = async () => {
    try {
      setAutoAssigning(true);
      const res = await axios.post(apiUrl('/api/tickets/admin/auto-assign'), {}, axiosConfig);
      addToast(res.data.message || 'Auto-assignment completed', 'success');
      fetchTickets();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to auto-assign tickets', 'error');
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
        addToast('Support session initialized', 'success');
        navigate(`/chat/${chatId}`);
        return;
      }
      addToast('Failed to initialize session', 'error');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to initialize session', 'error');
    } finally {
      setStartingChatTicketId(null);
    }
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

    if (activeTab === 'open') filtered = filtered.filter(t => t.status === 'OPEN');
    else if (activeTab === 'in-progress') filtered = filtered.filter(t => t.status === 'IN_PROGRESS');
    else if (activeTab === 'resolved') filtered = filtered.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

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

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
          <div className="relative bg-card border border-primary-500/30 p-4 rounded-2xl shadow-xl shadow-primary-500/10">
            <Ticket className="w-8 h-8 text-primary-500 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-surface-500 animate-pulse mt-2 tracking-wide uppercase">Loading tickets</p>
      </div>
    );
  }

  // Define Kanban Columns
  const columns = [
    { id: 'OPEN', title: 'Open', color: 'rose', tickets: filteredTickets.filter(t => t.status === 'OPEN') },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'amber', tickets: filteredTickets.filter(t => t.status === 'IN_PROGRESS') },
    { id: 'RESOLVED', title: 'Resolved', color: 'emerald', tickets: filteredTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED') }
  ];

  const TicketCardComponent = ({ ticket }: { ticket: any }) => (
    <Card
      className={`p-5 flex flex-col transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${isSupportStaff ? 'cursor-pointer' : ''}`}
      onClick={isSupportStaff ? () => navigate(`/ticket/${ticket.id}`) : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <Badge variant={getPriorityVariant(ticket.priority)}>
          {ticket.priority}
        </Badge>
        <div className={`w-2.5 h-2.5 rounded-full ${ticket.status === 'OPEN' ? 'bg-rose-500' : ticket.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor]`} />
      </div>

      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 leading-snug group-hover:text-primary-500 transition-colors">
        {ticket.title}
      </h3>
      <p className="text-[13px] text-surface-500 mb-5 line-clamp-3 leading-relaxed">
        {ticket.description}
      </p>

      <div className="mt-auto space-y-4">
        <div className="flex items-center gap-4 text-xs font-medium text-surface-500 border-t border-surface-200/50 pt-4">
           {ticket.assignedTo ? (
             <div className="flex items-center gap-1.5" title={`Assigned to ${ticket.assignedTo.name}`}>
               <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-[9px] uppercase">
                 {ticket.assignedTo.name?.charAt(0) || 'A'}
               </div>
               <span className="truncate max-w-[80px]">{ticket.assignedTo.name}</span>
             </div>
           ) : (
             <span className="italic text-surface-400">Unassigned</span>
           )}
           <div className="ml-auto text-[10px] tracking-wide uppercase">
             {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
           </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {user?.role === 'ADMIN' && !ticket.assignedTo && ticket.status === 'OPEN' && (
              <Button variant="secondary" size="sm" fullWidth onClick={(e: any) => { e.stopPropagation(); setSelectedTicketForAssign(ticket); setShowAssignModal(true);}}>
                Suggest Agent
              </Button>
            )}
            {isSupportStaff && ticket.status === 'OPEN' && (
              <Button variant="primary" size="sm" fullWidth onClick={(e: any) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'IN_PROGRESS'); }}>
                Take Over
              </Button>
            )}
            {isSupportStaff && ticket.status === 'IN_PROGRESS' && (
              <Button variant="outline" size="sm" fullWidth className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" onClick={(e: any) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'RESOLVED'); }}>
                Mark Resolved
              </Button>
            )}
          </div>
          {isSupportStaff && (
            <Button variant="glass" size="sm" fullWidth loading={startingChatTicketId === ticket.id} onClick={(e: any) => { e.stopPropagation(); handleStartChat(ticket);}}>
              Live Chat Session
            </Button>
          )}
          {!isSupportStaff && (
             <div className="text-[11px] font-medium text-surface-500 bg-surface-50 p-2 rounded-lg border border-surface-200">
               Under review by support.
             </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Page Header (Sticky) */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="px-6 py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between max-w-[1600px] mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                <Ticket className="w-3.5 h-3.5" />
                Support Queue
              </div>
              <h1 className="heading-1">Ticket Management</h1>
              <p className="text-surface-500 max-w-2xl text-[15px] leading-relaxed">
                Track, assign, and resolve customer support requests efficiently.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1 bg-surface-50 border border-surface-200 rounded-xl p-1 mr-2 hidden sm:flex">
                 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-500' : 'text-surface-400 hover:text-surface-900'}`} title="Grid View">
                   <LayoutGrid className="w-4 h-4" />
                 </button>
                 <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary-500' : 'text-surface-400 hover:text-surface-900'}`} title="Board View">
                   <Columns className="w-4 h-4" />
                 </button>
              </div>

              {user?.role === 'ADMIN' && (
                <Button variant="secondary" size="md" icon={<Zap className="w-4 h-4" />} onClick={handleAutoAssign} loading={autoAssigning} disabled={autoAssigning}>
                  Auto-Rout
                </Button>
              )}
              <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                New Request
              </Button>
            </div>
          </div>
          
          <div className="max-w-[1600px] mx-auto mt-8">
            <NavigationTabs
              tabs={[
                { id: 'all', label: 'All Requests', icon: <Ticket className="w-4 h-4" /> },
                { id: 'open', label: 'Action Needed', icon: <AlertCircle className="w-4 h-4" /> },
                { id: 'in-progress', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
                { id: 'resolved', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> }
              ]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as any)}
            />
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto w-full">
        <div className="max-w-[1600px] mx-auto pb-12 w-full space-y-8 animate-fade-in-up">

          {/* Filters Bar */}
          <div className="glass-lg p-2 rounded-2xl flex flex-col md:flex-row gap-4">
             <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search by title, ID, or description..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="border-none bg-transparent shadow-none"
                />
             </div>
             <div className="flex flex-col md:flex-row gap-2">
                <div className="h-full w-px bg-surface-200/50 hidden md:block my-2"></div>
                <Select
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                  className="border-none bg-transparent shadow-none w-full md:w-[150px] text-sm font-medium"
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'OPEN', label: 'Open' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'RESOLVED', label: 'Resolved' },
                  ]}
                />
                <div className="h-full w-px bg-surface-200/50 hidden md:block my-2"></div>
                <Select
                  value={filterPriority}
                  onChange={(e: any) => setFilterPriority(e.target.value)}
                  className="border-none bg-transparent shadow-none w-full md:w-[150px] text-sm font-medium"
                  options={[
                    { value: 'ALL', label: 'All Priorities' },
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' },
                  ]}
                />
             </div>
          </div>

          {filteredTickets.length > 0 ? (
             viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredTickets.map(ticket => (
                     <TicketCardComponent key={ticket.id} ticket={ticket} />
                  ))}
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                   {columns.map(col => (
                     <div key={col.id} className="glass rounded-[2rem] p-4 border border-surface-200 bg-surface-50/50 min-h-[500px]">
                        <div className="flex items-center justify-between px-2 mb-4">
                           <div className="flex items-center gap-2">
                             <div className={`w-2.5 h-2.5 rounded-full bg-${col.color}-500 shadow-[0_0_8px_currentColor]`} />
                             <h3 className="font-bold uppercase tracking-wider text-surface-600 text-[11px]">{col.title}</h3>
                           </div>
                           <Badge variant="glass" className="font-mono text-[10px]">{col.tickets.length}</Badge>
                        </div>
                        <div className="space-y-4">
                           {col.tickets.map(ticket => (
                              <TicketCardComponent key={ticket.id} ticket={ticket} />
                           ))}
                           {col.tickets.length === 0 && (
                              <div className="p-8 text-center text-surface-400 border border-dashed border-surface-300 rounded-xl">
                                <p className="text-[11px] font-medium uppercase tracking-widest">Empty</p>
                              </div>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             )
          ) : (
             <div className="flex flex-col items-center justify-center p-16 glass-elevated border border-dashed border-surface-300 rounded-3xl text-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Ticket className="w-10 h-10 text-surface-400" />
                </div>
                <h3 className="heading-3 mb-2 text-foreground">No tickets found</h3>
                <p className="text-surface-500 mb-8 max-w-md">
                   {searchTerm || filterStatus !== 'ALL' || filterPriority !== 'ALL'
                    ? 'Adjust your filters to see more results.'
                    : 'Your queue is empty. You\'re all caught up!'}
                </p>
                {!searchTerm && filterStatus === 'ALL' && filterPriority === 'ALL' && (
                  <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
                    Submit New Request
                  </Button>
                )}
             </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Ticket"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" icon={<Play className="w-4 h-4" />} onClick={handleCreateTicket}>Submit Request</Button>
          </>
        }
      >
        <div className="space-y-6 pt-2">
          {/* AI Copilot Banner */}
          <div className="rounded-2xl border bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5 border-indigo-500/20 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-5 h-5 fill-indigo-500/20" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Ticket Copilot</h3>
                <p className="text-[11px] text-surface-500 font-medium">Let AI draft and format your request</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 relative z-10">
              <Button type="button" variant="secondary" size="sm" onClick={handleRunTicketAIPack} loading={ticketAiPackLoading} className="shadow-none border-indigo-500/20 hover:border-indigo-500/40">
                Smart Optimize
              </Button>
            </div>

            {ticketAiResult && (
              <div className="mt-4 p-4 rounded-xl glass text-[13px] font-mono text-surface-700 dark:text-surface-300 leading-relaxed max-h-40 overflow-y-auto relative z-10 border border-white/20">
                {ticketAiResult}
              </div>
            )}
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-5">
            <Input
              label="Subject"
              type="text"
              value={newTicket.title}
              onChange={(e: any) => setNewTicket({ ...newTicket, title: e.target.value })}
              placeholder="Brief summary of your issue"
              required
            />
            <div className="space-y-1.5">
              <label className="label text-surface-600">Detailed Description</label>
              <textarea
                 className="w-full bg-card rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 p-4 min-h-[160px] text-sm resize-y outline-none transition-all shadow-sm group"
                 placeholder="Please describe the issue in detail. The AI Copilot can help format this if you provide raw notes."
                 value={newTicket.description}
                 onChange={(e: any) => setNewTicket({ ...newTicket, description: e.target.value })}
                 required
              />
            </div>
            <div className="w-1/2">
              <Select
                label="Priority Level"
                value={newTicket.priority}
                onChange={(e: any) => setNewTicket({ ...newTicket, priority: e.target.value })}
                options={[
                  { value: 'LOW', label: 'Low - No rush' },
                  { value: 'MEDIUM', label: 'Medium - Needs attention' },
                  { value: 'HIGH', label: 'High - Blocking work' },
                  { value: 'URGENT', label: 'Urgent - System down' },
                ]}
              />
            </div>
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
        title="Escalate to Agent"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => {setShowAssignModal(false); setSelectedAgent('');}}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignTicket}>Route Request</Button>
          </>
        }
      >
        <div className="space-y-5 pt-2">
          {selectedTicketForAssign && (
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200/60">
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-wider mb-1">Target Ticket</p>
              <p className="font-semibold text-foreground">{selectedTicketForAssign.title}</p>
            </div>
          )}
          <Select
            label="Select Responder"
            value={selectedAgent}
            onChange={(e: any) => setSelectedAgent(e.target.value)}
            options={[
              { value: '', label: 'Choose an available agent...' },
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
