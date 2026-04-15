import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../config/api';
import {
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  RotateCcw,
  Loader2,
  Search,
  Zap,
  ArrowRight,
  User,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, StatCard, NavigationTabs, Badge, Select } from '../components/ui';
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../services/cacheService';
import { useAuthStore } from '../store/useAuthStore';

type AgentTab = 'all' | 'open' | 'in-progress' | 'resolved';
type QueueMode = 'my' | 'unassigned' | 'urgent' | 'all';
type SortMode = 'priority' | 'newest' | 'oldest';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  userId: string;
  assignedToId?: string;
  assignedTo?: { id: string; name: string; email: string };
  user?: { id: string; name: string; email: string };
}

const priorityWeight: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const SupportAgentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<AgentTab>('all');
  const [queueMode, setQueueMode] = useState<QueueMode>('my');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [error, setError] = useState<string | null>(null);
  const [queueAiMode, setQueueAiMode] = useState('next_steps');
  const [queueAiLoading, setQueueAiLoading] = useState(false);
  const [queueAiOutput, setQueueAiOutput] = useState('');
  const [runningAiPack, setRunningAiPack] = useState<string | null>(null);
  const [startingChatTicketId, setStartingChatTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets(true);
  }, []);

  const fetchTickets = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setRefreshing(true);

      // Load from cache first for initial load
      if (isInitial) {
        const cached = cacheService.get(CACHE_KEYS.TICKETS_LIST);
        if (cached && Array.isArray(cached)) {
          setTickets(cached);
        }
      }

      const response = await axiosInstance.get(API_ENDPOINTS.TICKETS_LIST);
      // Handle both response formats: { data, pagination } and direct array
      const allTickets = response.data?.data || response.data?.tickets || response.data || [];
      const ticketArray = Array.isArray(allTickets) ? allTickets : [];
      setTickets(ticketArray);
      cacheService.set(CACHE_KEYS.TICKETS_LIST, ticketArray, CACHE_TTL.MEDIUM);
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

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    urgent: tickets.filter(t => t.priority === 'URGENT').length,
    myAssigned: tickets.filter(t => t.assignedToId === user?.id).length,
    unassigned: tickets.filter(t => !t.assignedToId).length
  };

  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    if (activeTab === 'open') filtered = filtered.filter(t => t.status === 'OPEN');
    else if (activeTab === 'in-progress') filtered = filtered.filter(t => t.status === 'IN_PROGRESS');
    else if (activeTab === 'resolved') filtered = filtered.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

    if (queueMode === 'my') filtered = filtered.filter(t => t.assignedToId === user?.id || !t.assignedToId);
    else if (queueMode === 'unassigned') filtered = filtered.filter(t => !t.assignedToId);
    else if (queueMode === 'urgent') filtered = filtered.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm) ||
        t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortMode === 'priority') {
      filtered.sort((a, b) => {
        const p = (priorityWeight[a.priority] ?? 4) - (priorityWeight[b.priority] ?? 4);
        if (p !== 0) return p;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } else if (sortMode === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [tickets, activeTab, queueMode, searchTerm, sortMode, user?.id]);

  const topFocus = filteredTickets.slice(0, 5);

  const runQueueCopilot = async () => {
    try {
      setQueueAiLoading(true);
      const focusContext = filteredTickets
        .slice(0, 8)
        .map((t, idx) => `${idx + 1}. [${t.priority}/${t.status}] ${t.title} - ${t.description}`)
        .join('\n');

      const res = await axiosInstance.post(API_ENDPOINTS.TICKET_AI_COPILOT, {
        flow: 'problem_solving',
        mode: queueAiMode,
        context: focusContext || 'No queue items available.'
      });

      setQueueAiOutput(res.data?.suggestion || 'No AI output generated.');
    } catch (err: any) {
      setQueueAiOutput('');
      setError(err.response?.data?.error || 'Failed to run queue AI copilot');
    } finally {
      setQueueAiLoading(false);
    }
  };

  const runQueueAiPack = async (pack: 'triage-pack' | 'handoff-pack') => {
    try {
      setRunningAiPack(pack);
      setQueueAiLoading(true);
      const focusContext = filteredTickets
        .slice(0, 8)
        .map((t, idx) => `${idx + 1}. [${t.priority}/${t.status}] ${t.title} - ${t.description}`)
        .join('\n');

      const packModes = pack === 'triage-pack'
        ? ['summary', 'diagnostic_checklist', 'priority_recommendation', 'next_steps']
        : ['status_update', 'handoff_bundle', 'risk_check', 'timeline_update'];

      const res = await axiosInstance.post(API_ENDPOINTS.TICKET_AI_COPILOT, {
        flow: 'problem_solving',
        mode: packModes[0],
        modes: packModes,
        context: focusContext || 'No queue items available.'
      });

      const combined = Array.isArray(res.data?.outputs)
        ? res.data.outputs.map((o: any) => `## ${o.mode}\n${o.suggestion}`).join('\n\n')
        : res.data?.suggestion || 'No AI output generated.';
      setQueueAiOutput(combined);
    } catch (err: any) {
      setQueueAiOutput('');
      setError(err.response?.data?.error || 'Failed to run queue AI pack');
    } finally {
      setQueueAiLoading(false);
      setRunningAiPack(null);
    }
  };

  const handleStartChat = async (ticket: TicketData) => {
    try {
      setStartingChatTicketId(ticket.id);
      const res = await axiosInstance.post(`/api/tickets/${ticket.id}/init-chat`, {});
      const chatId = res.data?.chat?.id;
      if (chatId) {
        navigate(`/chat/${chatId}`);
        return;
      }
      setError('Failed to start chat for this ticket');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start chat for this ticket');
    } finally {
      setStartingChatTicketId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 min-h-screen flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading support queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-40">
        <div className="px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <Ticket className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="heading-1">Support Queue</h1>
              <p className="text-surface-600 mt-1">Workflow-first queue for faster resolution</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => fetchTickets(false)}
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
                Open Full Ticket Center
              </Button>
            </Link>
          </div>
        </div>

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

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard label="Total" value={stats.total} icon={<Ticket className="w-6 h-6" />} />
          <StatCard label="Open" value={stats.open} icon={<AlertCircle className="w-6 h-6" />} />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-6 h-6" />} />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle className="w-6 h-6" />} />
          <StatCard label="Urgent" value={stats.urgent} icon={<Zap className="w-6 h-6" />} />
          <StatCard label="Unassigned" value={stats.unassigned} icon={<User className="w-6 h-6" />} />
        </div>

        <Card elevated className="p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Input
              type="text"
              placeholder="Search by ticket, customer, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <Select
              value={queueMode}
              onChange={(e) => setQueueMode(e.target.value as QueueMode)}
              options={[
                { value: 'my', label: 'My queue (assigned + unassigned)' },
                { value: 'unassigned', label: 'Unassigned only' },
                { value: 'urgent', label: 'Urgent + high priority' },
                { value: 'all', label: 'All visible tickets' }
              ]}
            />
            <Select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              options={[
                { value: 'priority', label: 'Sort by priority + age' },
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' }
              ]}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'my', label: `My Queue (${stats.myAssigned + stats.unassigned})` },
              { key: 'unassigned', label: `Unassigned (${stats.unassigned})` },
              { key: 'urgent', label: `Urgent (${stats.urgent})` },
              { key: 'all', label: `All (${stats.total})` }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setQueueMode(item.key as QueueMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  queueMode === item.key
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-surface-50 text-surface-600 border-surface-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <Card elevated className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-surface-900">Priority focus queue</h2>
                <p className="text-xs text-surface-500">{filteredTickets.length} ticket(s) in current view</p>
              </div>
              <p className="text-sm text-surface-600 mt-1">
                Work top-to-bottom for fastest SLA-safe handling.
              </p>
            </Card>

            {filteredTickets.length === 0 ? (
              <Card elevated className="p-12 text-center">
                <Ticket className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                <p className="text-surface-600 font-medium">
                  {searchTerm ? 'No tickets match your search' : `No ${activeTab === 'all' ? '' : activeTab} tickets`}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket, index) => (
                  <Card key={ticket.id} elevated className="p-4 hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-start lg:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {index < 3 && <Badge variant="warning">Top {index + 1}</Badge>}
                          <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-100 text-xs font-medium text-surface-700">
                            {getStatusIcon(ticket.status)}
                            <span>{ticket.status}</span>
                          </div>
                          <div className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {ticket.assignedToId === user?.id ? 'Assigned to me' : ticket.assignedToId ? 'Assigned' : 'Unassigned'}
                          </div>
                        </div>

                        <h3 className="text-base font-semibold text-surface-900">{ticket.title}</h3>
                        <p className="text-sm text-surface-600 mt-1 line-clamp-2">{ticket.description}</p>

                        <div className="text-xs text-surface-500 mt-2 flex gap-3 flex-wrap">
                          <span>ID: {ticket.id.slice(0, 8)}...</span>
                          <span>•</span>
                          <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                          {ticket.user && (
                            <>
                              <span>•</span>
                              <span>{ticket.user.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap lg:flex-col lg:items-stretch">
                        <Button size="sm" variant="primary" onClick={() => navigate(`/ticket/${ticket.id}`)}>
                          Open Ticket
                        </Button>
                        <Button size="sm" variant="outline" icon={<MessageSquare className="w-4 h-4" />} onClick={() => navigate(`/ticket/${ticket.id}`)}>
                          Chat & Context
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Zap className="w-4 h-4" />}
                          loading={startingChatTicketId === ticket.id}
                          onClick={() => handleStartChat(ticket)}
                        >
                          Start Chat
                        </Button>
                        <Button size="sm" variant="ghost" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate(`/tickets?id=${ticket.id}`)}>
                          Full Workflow
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card elevated className="p-4">
              <h3 className="text-sm font-semibold text-surface-900">Workflow quick actions</h3>
              <div className="mt-3 space-y-2">
                <Button className="w-full justify-start" variant="outline" onClick={() => setQueueMode('unassigned')}>
                  Pick unassigned tickets
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setQueueMode('urgent')}>
                  Focus urgent/high first
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/tickets')}>
                  Open ticket center
                </Button>
              </div>
            </Card>

            <Card elevated className="p-4 space-y-3 bg-amber-50/40 border-amber-200">
              <h3 className="text-sm font-semibold text-surface-900">AI Queue Copilot</h3>
              <div className="flex gap-2 flex-wrap">
                {[
                  ['next_steps', 'Next steps'],
                  ['priority_recommendation', 'Priority advice'],
                  ['risk_check', 'Risk check'],
                  ['status_update', 'Status draft'],
                  ['diagnostic_checklist', 'Diagnostics'],
                  ['timeline_update', 'Timeline update']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setQueueAiMode(value)}
                    className={`px-2 py-1 rounded-md text-xs border ${
                      queueAiMode === value
                        ? 'bg-amber-500/20 text-amber-700 border-amber-400'
                        : 'bg-card text-surface-600 border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={runQueueCopilot} loading={queueAiLoading}>
                Analyze current queue
              </Button>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="w-full" onClick={() => runQueueAiPack('triage-pack')} loading={runningAiPack === 'triage-pack'}>
                  Run Triage Pack
                </Button>
                <Button variant="outline" className="w-full" onClick={() => runQueueAiPack('handoff-pack')} loading={runningAiPack === 'handoff-pack'}>
                  Run Handoff Pack
                </Button>
              </div>
              {queueAiOutput && (
                <div className="p-3 rounded-lg bg-card border border-border text-xs text-surface-700 whitespace-pre-wrap">
                  {queueAiOutput}
                </div>
              )}
            </Card>

            <Card elevated className="p-4">
              <h3 className="text-sm font-semibold text-surface-900">Immediate focus (top 5)</h3>
              {topFocus.length === 0 ? (
                <p className="text-sm text-surface-500 mt-2">No tickets in current view.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {topFocus.map((t) => (
                    <button
                      key={`focus-${t.id}`}
                      onClick={() => navigate(`/ticket/${t.id}`)}
                      className="w-full text-left p-2 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/40"
                    >
                      <p className="text-xs font-semibold text-surface-900 truncate">{t.title}</p>
                      <p className="text-[11px] text-surface-500 mt-1">{t.priority} • {t.status}</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportAgentDashboard;
