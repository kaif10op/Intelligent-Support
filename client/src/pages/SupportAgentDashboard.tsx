import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../config/api';
import {
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  Loader2,
  Search,
  Zap,
  User,
  MessageSquare,
  Sparkles
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

      if (isInitial) {
        const cached = cacheService.get(CACHE_KEYS.TICKETS_LIST);
        if (cached && Array.isArray(cached)) {
          setTickets(cached);
        }
      }

      const response = await axiosInstance.get(API_ENDPOINTS.TICKETS_LIST);
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
      case 'OPEN': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'IN_PROGRESS': return <Clock className="w-3.5 h-3.5" />;
      case 'RESOLVED':
      case 'CLOSED': return <CheckCircle className="w-3.5 h-3.5" />;
      default: return <Ticket className="w-3.5 h-3.5" />;
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
      setError(err.response?.data?.error || 'Failed to run queue Copilot');
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent page-enter gap-4">
         <div className="relative">
           <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
           <div className="relative bg-card p-4 rounded-full shadow-lg border border-primary-500/20">
              <Loader2 size={32} className="animate-spin text-primary-500" />
           </div>
         </div>
         <p className="text-[12px] text-surface-500 font-bold uppercase tracking-widest animate-pulse mt-2">Loading Support Index</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      
      {/* Decorative Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[40%] h-[500px] bg-gradient-to-b from-indigo-500/5 to-transparent blur-[100px] rounded-bl-full"></div>
         <div className="absolute bottom-0 left-0 w-[50%] h-[300px] bg-gradient-to-t from-sky-500/5 to-transparent blur-[100px] rounded-tr-full"></div>
      </div>

      {/* Glass Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-40 transition-all">
        <div className="px-6 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 flex items-center justify-center shadow-sm">
                  <Ticket className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
               </div>
               <div>
                 <h1 className="heading-1 tracking-tight pr-4">Copilot Dispatch</h1>
                 <p className="text-sm text-surface-500 font-medium">Algorithmic workflow queue for optimal SLA delivery</p>
               </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="glass"
                size="md"
                icon={<RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchTickets(false)}
                loading={refreshing}
                disabled={refreshing}
                className="shadow-sm"
              >
                Sync
              </Button>
              <Link to="/tickets">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Zap className="w-4 h-4" />}
                  className="shadow-md shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 transition-all"
                >
                  Full Action Center
                </Button>
              </Link>
            </div>
          </div>

          <div className="-mb-6 md:-mb-8 relative z-10 pt-2">
            <NavigationTabs
              tabs={[
                { id: 'all', label: 'Global Array', icon: <Ticket className="w-4 h-4" /> },
                { id: 'open', label: 'Awaiting Action', icon: <AlertCircle className="w-4 h-4" /> },
                { id: 'in-progress', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
                { id: 'resolved', label: 'Safely Closed', icon: <CheckCircle className="w-4 h-4" /> }
              ]}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as any)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-10 overflow-y-auto w-full relative z-10">
        <div className="max-w-[1400px] mx-auto pb-12 animate-fade-in-up">
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Threads" value={stats.total} icon={<Ticket className="w-5 h-5 text-surface-500" />} />
            <StatCard label="Awaiting" value={stats.open} icon={<AlertCircle className="w-5 h-5 text-indigo-500" />} />
            <StatCard label="Active" value={stats.inProgress} icon={<Clock className="w-5 h-5 text-blue-500" />} />
            <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} />
            <StatCard label="Critical" value={stats.urgent} icon={<Zap className="w-5 h-5 text-rose-500" />} />
            <StatCard label="Orphaned" value={stats.unassigned} icon={<User className="w-5 h-5 text-amber-500" />} />
          </div>

          <Card elevated className="p-0 overflow-hidden border-surface-200 mb-8 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface-200 bg-surface-50/50">
             <div className="p-4 flex-1">
               <Input
                 type="text"
                 placeholder="Search identifiers, customer metadata, context..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 icon={<Search className="w-4 h-4 text-surface-400" />}
                 className="border-none shadow-none focus:ring-0 bg-transparent text-[13px] w-full"
               />
             </div>
             <div className="p-3 shrink-0 flex items-center gap-3">
               <Select
                 value={queueMode}
                 onChange={(e) => setQueueMode(e.target.value as QueueMode)}
                 options={[
                   { value: 'my', label: 'Target: My active queue' },
                   { value: 'unassigned', label: 'Target: Unclaimed flow' },
                   { value: 'urgent', label: 'Target: Critical bypass' },
                   { value: 'all', label: 'Target: Global view' }
                 ]}
                 className="w-48 text-[12px] bg-white dark:bg-card border-none shadow-sm"
               />
               <Select
                 value={sortMode}
                 onChange={(e) => setSortMode(e.target.value as SortMode)}
                 options={[
                   { value: 'priority', label: 'Sort: Urgency decay' },
                   { value: 'newest', label: 'Sort: Chronological' },
                   { value: 'oldest', label: 'Sort: Oldest hold' }
                 ]}
                 className="w-40 text-[12px] bg-white dark:bg-card border-none shadow-sm"
               />
             </div>
          </Card>

          {error && (
             <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 animate-fade-in mb-8">
                <AlertCircle size={18} className="text-rose-500 mt-0.5" />
                <div>
                   <p className="font-bold text-[13px] text-rose-700">Dispatch Failure</p>
                   <p className="text-[12px] text-rose-600/80">{error}</p>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Thread Flow */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="heading-4 text-surface-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-500" /> Dispatch Stream
                 </h2>
                 <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400 bg-surface-100 px-3 py-1 rounded-full">
                    {filteredTickets.length} Items Loaded
                 </p>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-surface-200 rounded-3xl bg-surface-50/50">
                  <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
                     <CheckCircle size={24} className="text-surface-400" />
                  </div>
                  <p className="font-bold text-foreground text-[15px] mb-1">Queue is fully optimized</p>
                  <p className="text-[13px] text-surface-500 text-center max-w-sm">
                    {searchTerm ? 'No threads match the current parameters.' : `No threads currently found in ${activeTab} view. Subsystems clear.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket, index) => (
                    <Card key={ticket.id} elevated className={`p-0 overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${index < 3 && queueMode === 'urgent' ? 'border-l-rose-500' : 'border-l-transparent'} hover:border-l-primary-500 group`}>
                      <div className="p-5 flex flex-col lg:flex-row gap-5 lg:items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {index < 3 && (
                               <Badge variant="error" size="sm" className="shadow-sm">
                                  <Sparkles size={10} className="mr-1" /> SLA P{index + 1}
                               </Badge>
                            )}
                            <Badge variant={getPriorityVariant(ticket.priority)} size="sm" className="shadow-sm">{ticket.priority}</Badge>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                                ticket.status === 'OPEN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {getStatusIcon(ticket.status)}
                              <span>{ticket.status}</span>
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                ticket.assignedToId === user?.id ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                ticket.assignedToId ? 'bg-surface-50 text-surface-600 border-surface-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {ticket.assignedToId === user?.id ? 'Assigned: You' : ticket.assignedToId ? 'Claimed' : 'Orphaned'}
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary-600 transition-colors">{ticket.title}</h3>
                          <p className="text-[13px] text-surface-600 line-clamp-2 leading-relaxed">{ticket.description}</p>

                          <div className="text-[11px] font-bold tracking-wide text-surface-400 mt-3 flex items-center gap-3 flex-wrap">
                            <span className="font-mono bg-surface-100 px-2 py-0.5 rounded text-surface-500">#{ticket.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                            {ticket.user && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-primary-600"><User size={12}/> {ticket.user.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap lg:flex-col lg:items-stretch lg:w-40 shrink-0 border-t lg:border-t-0 lg:border-l border-surface-100 pt-4 lg:pt-0 lg:pl-5">
                          <Button size="sm" variant="primary" onClick={() => navigate(`/ticket/${ticket.id}`)} className="justify-center shadow-md shadow-primary-500/20">
                            Deep Dive
                          </Button>
                          <Button size="sm" variant="glass" icon={<MessageSquare className="w-3.5 h-3.5" />} onClick={() => navigate(`/ticket/${ticket.id}`)} className="justify-center text-[12px] bg-white dark:bg-card">
                            Review Context
                          </Button>
                          <Button
                            size="sm"
                            variant="glass"
                            icon={<Zap className="w-3.5 h-3.5" />}
                            loading={startingChatTicketId === ticket.id}
                            onClick={() => handleStartChat(ticket)}
                            className="justify-center text-[12px] bg-white dark:bg-card"
                          >
                            Init Live Link
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Side Tools */}
            <div className="space-y-6">
              
              {/* Copilot Engine */}
              <Card elevated className="p-0 overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></div>
                <div className="p-5 border-b border-indigo-500/10">
                   <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-500" />
                      <h3 className="heading-4 text-indigo-900 dark:text-indigo-100">Copilot Subroutine</h3>
                   </div>
                   <p className="text-[12px] text-surface-500 font-medium mt-1">Run algorithmic analysis on current queue buffer.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {[
                      ['next_steps', 'Projection'],
                      ['priority_recommendation', 'Urgency Audit'],
                      ['risk_check', 'Risk Scan'],
                      ['diagnostic_checklist', 'Diagnostics']
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setQueueAiMode(value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                          queueAiMode === value
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white dark:bg-card text-surface-600 border border-surface-200 hover:border-indigo-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Button variant="primary" fullWidth onClick={runQueueCopilot} loading={queueAiLoading} className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-500/20">
                    <Zap size={16} className="mr-2" /> Execute Routine
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                       <div className="w-full border-t border-indigo-500/10" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium">
                       <span className="bg-transparent px-2 text-surface-400">BATCH MACROS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="glass" className="text-[12px] px-0 bg-white dark:bg-card border-indigo-500/20 text-indigo-700 hover:bg-indigo-50" onClick={() => runQueueAiPack('triage-pack')} loading={runningAiPack === 'triage-pack'}>
                      Auto-Triage Pack
                    </Button>
                    <Button variant="glass" className="text-[12px] px-0 bg-white dark:bg-card border-indigo-500/20 text-indigo-700 hover:bg-indigo-50" onClick={() => runQueueAiPack('handoff-pack')} loading={runningAiPack === 'handoff-pack'}>
                      Sync Handoff Pack
                    </Button>
                  </div>
                </div>

                {queueAiOutput && (
                  <div className="p-5 bg-black/5 dark:bg-black/20 border-t border-indigo-500/10">
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/5 text-[12px] text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed shadow-inner backdrop-blur-md">
                       <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                          <Zap size={10} /> Copilot Output Stream
                       </div>
                       {queueAiOutput}
                    </div>
                  </div>
                )}
              </Card>

              {/* Fast Priority Stack */}
              <Card elevated className="p-0 overflow-hidden border-surface-200">
                <div className="px-5 py-4 border-b border-surface-200/50 bg-surface-50/50">
                   <h3 className="text-[13px] font-bold text-foreground">Immediate Override Stack</h3>
                </div>
                <div className="p-2 space-y-1">
                  {topFocus.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-surface-400 font-medium">
                       Stack completely cleared.
                    </div>
                  ) : (
                    topFocus.map((t) => (
                      <button
                        key={`focus-${t.id}`}
                        onClick={() => navigate(`/ticket/${t.id}`)}
                        className="w-full text-left p-3 rounded-xl hover:bg-primary-50/50 hover:scale-[1.02] transition-all group border border-transparent hover:border-primary-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${t.priority === 'URGENT' ? 'bg-rose-500' : t.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <p className="text-[13px] font-bold text-surface-900 truncate group-hover:text-primary-700">{t.title}</p>
                        </div>
                        <p className="text-[11px] font-medium text-surface-500 ml-3.5">{t.priority} Queue • {t.status}</p>
                      </button>
                    ))
                  )}
                </div>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportAgentDashboard;
