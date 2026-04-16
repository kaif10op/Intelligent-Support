import { useCallback, useEffect, useRef, useState } from 'react';
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
  Sparkles,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, apiUrl, axiosConfig } from '../config/api';
import { Button, Card, Input, Modal, StatCard, NavigationTabs } from '../components/ui';
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../services/cacheService';

type DashboardTab = 'overview' | 'knowledge-bases' | 'activity';

const Dashboard = () => {
  const { addToast } = useToast();
  const [kbs, setKbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'docs'>('recent');
  const [tickets, setTickets] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [ticketStats, setTicketStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const didInitialFetch = useRef(false);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setRefreshing(true);

      // Load from cache first for initial load
      if (isInitial) {
        const cachedKbs = cacheService.get(CACHE_KEYS.KB_LIST);
        const cachedChats = cacheService.get(CACHE_KEYS.CHAT_RECENT);

        if (cachedKbs) {
          setKbs(Array.isArray(cachedKbs) ? cachedKbs : []);
        }
        if (cachedChats) {
          setRecentChats(Array.isArray(cachedChats) ? cachedChats : []);
        }
      }

      // Fast path: first render only loads KBs for instant dashboard usability.
      const kbRes = await axios.get(API_ENDPOINTS.KB_LIST, axiosConfig).catch(() => ({ data: [] }));

      const kbData = Array.isArray(kbRes.data) ? kbRes.data : kbRes.data.data || [];
      const kbArray = Array.isArray(kbData) ? kbData : [];
      setKbs(kbArray);
      cacheService.set(CACHE_KEYS.KB_LIST, kbArray, CACHE_TTL.MEDIUM);

      // Defer heavier calls so page is interactive quickly.
      setTimeout(async () => {
        const [ticketRes, chatRes] = await Promise.all([
          axios.get(apiUrl('/api/tickets/my?limit=20'), axiosConfig).catch(() => ({ data: [] })),
          axios.get(`${API_ENDPOINTS.CHAT_RECENT}?limit=5`, axiosConfig).catch(() => ({ data: {} }))
        ]);

        const ticketData = Array.isArray(ticketRes.data) ? ticketRes.data : ticketRes.data.data || [];
        const ticketArray = Array.isArray(ticketData) ? ticketData : [];
        setTickets(ticketArray);
        setTicketStats({
          open: ticketArray.filter((t: any) => t.status === 'OPEN').length,
          inProgress: ticketArray.filter((t: any) => t.status === 'IN_PROGRESS').length,
          resolved: ticketArray.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        });

        const chatPayload = chatRes.data?.data || chatRes.data?.chats || [];
        const chatArray = Array.isArray(chatPayload) ? chatPayload : [];
        setRecentChats(chatArray);
        cacheService.set(CACHE_KEYS.CHAT_RECENT, chatArray, CACHE_TTL.MEDIUM);
      }, isInitial ? 0 : 100);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      addToast('Failed to load dashboard data', 'error');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    fetchData(true);
  }, [fetchData]);

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
      fetchData();
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
      fetchData();
    } catch (err: any) {
      console.error(err);
      addToast('Failed to delete KB', 'error');
    }
  };

  const getSortedKbs = () => {
    const sorted = [...kbs];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'docs') {
      sorted.sort((a, b) => (b._count?.documents || 0) - (a._count?.documents || 0));
    }
    return sorted;
  };

  const filteredKbs = getSortedKbs().filter(
    (kb) =>
      kb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kb.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
          <div className="relative bg-card border border-primary-500/30 p-4 rounded-2xl shadow-xl shadow-primary-500/10">
            <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-medium text-surface-500 animate-pulse mt-2 tracking-wide uppercase">Preparing workspace</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Page Header (Sticky) */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="px-6 py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between max-w-7xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                <TrendingUp className="w-3.5 h-3.5" />
                Workspace Overview
              </div>
              <h1 className="heading-1">Dashboard</h1>
              <p className="text-surface-500 max-w-2xl text-[15px] leading-relaxed">
                Your operational view of AI knowledge bases, active customer conversations, and support queue.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="glass"
                size="md"
                icon={<RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                onClick={() => fetchData(false)}
                disabled={refreshing}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowModal(true)}
              >
                New KB
              </Button>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto mt-8">
            <NavigationTabs
              tabs={[
                { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
                { id: 'knowledge-bases', label: 'Knowledge Bases', icon: <Database className="w-4 h-4" /> },
                { id: 'activity', label: 'Activity', icon: <MessageSquare className="w-4 h-4" /> }
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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                  label="Knowledge Bases"
                  value={kbs.length}
                  icon={<Database className="w-6 h-6" />}
                />
                <StatCard
                  label="Total Chats"
                  value={recentChats.length}
                  icon={<MessageSquare className="w-6 h-6" />}
                />
                <StatCard
                  label="Open Tickets"
                  value={ticketStats.open}
                  icon={<AlertCircle className="w-6 h-6" />}
                />
                <StatCard
                  label="Resolved"
                  value={ticketStats.resolved}
                  icon={<CheckCircle className="w-6 h-6" />}
                />
              </div>

              <div className="grid lg:grid-cols-[1fr_350px] gap-8">
                {/* Main section left */}
                <div className="space-y-8">
                  {/* Ticket Status Summary */}
                  {tickets.length > 0 && (
                    <Card elevated className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="heading-4">Queue Summary</h3>
                        <Link to="/tickets" className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors">
                          View all →
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link to="/tickets?status=open" className="group block">
                          <div className="relative p-5 border border-surface-200/60 rounded-xl bg-surface-50/50 hover:bg-white dark:hover:bg-surface-100 transition-all duration-300 hover:shadow-sm overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                              <AlertCircle className="w-16 h-16" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-2">Open</p>
                            <p className="text-3xl font-bold font-heading text-rose-500">{ticketStats.open}</p>
                          </div>
                        </Link>
                        
                        <Link to="/tickets?status=in-progress" className="group block">
                          <div className="relative p-5 border border-surface-200/60 rounded-xl bg-surface-50/50 hover:bg-white dark:hover:bg-surface-100 transition-all duration-300 hover:shadow-sm overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                              <RotateCcw className="w-16 h-16" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-2">In Progress</p>
                            <p className="text-3xl font-bold font-heading text-amber-500">{ticketStats.inProgress}</p>
                          </div>
                        </Link>
                        
                        <Link to="/tickets?status=resolved" className="group block">
                          <div className="relative p-5 border border-surface-200/60 rounded-xl bg-surface-50/50 hover:bg-white dark:hover:bg-surface-100 transition-all duration-300 hover:shadow-sm overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                              <CheckCircle className="w-16 h-16" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-2">Resolved</p>
                            <p className="text-3xl font-bold font-heading text-emerald-500">{ticketStats.resolved}</p>
                          </div>
                        </Link>
                      </div>
                    </Card>
                  )}
                  
                  {/* Recent Activity Mini-Feed */}
                  {recentChats.length > 0 && (
                    <Card elevated className="p-0 overflow-hidden">
                      <div className="p-6 border-b border-surface-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="heading-4">Live Activity</h3>
                            <p className="text-xs text-surface-500">Last {recentChats.length} interactions</p>
                          </div>
                        </div>
                        <Link to="/chats">
                          <Button variant="outline" size="sm">Go to Chats</Button>
                        </Link>
                      </div>
                      
                      <div className="divide-y divide-surface-100/50">
                        {recentChats.map((chat, idx) => (
                          <Link key={idx} to={`/chat/${chat.id}`} className="flex items-start gap-4 p-5 hover:bg-surface-50/50 transition-colors group">
                            <div className="h-2 w-2 mt-2 rounded-full bg-sky-400 group-hover:animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                                {chat.title || 'Untitled Session'}
                              </p>
                              <p className="text-xs text-surface-500 mt-1 line-clamp-1">Agent active in: {chat.kb?.title || 'General Support'}</p>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors" />
                          </Link>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
                
                {/* Sidebar right */}
                <div className="space-y-6">
                  {/* Quick Actions Panel */}
                  <Card elevated gradient className="p-6">
                    <h3 className="heading-4 mb-2 text-white">Need to find something?</h3>
                    <p className="text-sm text-white/80 mb-6">Access key tools instantly.</p>
                    
                    <div className="flex flex-col gap-3">
                      <div className="relative group/btn">
                        <div className="absolute inset-0 bg-white/20 rounded-xl blur group-hover/btn:blur-md transition-all"></div>
                        <Button
                          variant="glass"
                          fullWidth
                          size="lg"
                          className="w-full relative shadow-none"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => setShowModal(true)}
                        >
                          New Knowledge Base
                        </Button>
                      </div>
                      <Link to="/chat/new" className="block relative group/btn">
                         <div className="absolute inset-0 bg-white/10 rounded-xl blur group-hover/btn:blur-md transition-all"></div>
                        <Button variant="glass" fullWidth size="lg" className="w-full relative shadow-none" icon={<MessageSquare className="w-4 h-4" />}>
                          Start AI Support Chat
                        </Button>
                      </Link>
                      <Link to="/search" className="block relative group/btn">
                         <div className="absolute inset-0 bg-white/10 rounded-xl blur group-hover/btn:blur-md transition-all"></div>
                        <Button variant="glass" fullWidth size="lg" className="w-full relative shadow-none" icon={<Search className="w-4 h-4" />}>
                          Global Search
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Bases Tab */}
          {activeTab === 'knowledge-bases' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 p-1 glass-lg rounded-2xl shadow-sm">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search knowledge bases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                    className="border-none bg-transparent shadow-none w-full"
                  />
                </div>
                <div className="h-full w-px bg-surface-200/50 hidden md:block my-2"></div>
                <div className="pr-1 py-1 w-full md:w-auto">
                   <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-full px-4 py-2 bg-transparent border-none text-sm font-medium text-surface-600 focus:outline-none focus:ring-0 cursor-pointer w-full"
                  >
                    <option value="recent">Sort: Most Recent</option>
                    <option value="name">Sort: Alphabetical</option>
                    <option value="docs">Sort: Document Count</option>
                  </select>
                </div>
              </div>

              {/* KB Grid */}
              {filteredKbs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredKbs.map((kb) => (
                    <Card key={kb.id} className="p-1 flex flex-col group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                      <div className="p-5 flex-1 flex flex-col bg-card rounded-xl">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <Database className="w-6 h-6 text-primary-500" />
                          </div>
                          <button
                            onClick={() => handleDelete(kb.id)}
                            className="p-2 rounded-lg transition-colors text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-semibold font-heading text-lg text-foreground tracking-tight mb-2 line-clamp-1">{kb.title}</h3>
                        <p className="text-sm text-surface-500 mb-6 line-clamp-2 flex-1 leading-relaxed">
                          {kb.description || 'No description provided for this knowledge base.'}
                        </p>

                        {/* Stats */}
                        <div className="flex gap-4 mb-6 text-[11px] font-semibold text-surface-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <Files className="w-3.5 h-3.5 text-primary-500/70" />
                            <span>{kb._count?.documents || 0} files</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-accent-500/70" />
                            <span>{kb._count?.chats || 0} chats</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Link to={`/kb/${kb.id}`} className="flex-1">
                            <Button variant="secondary" fullWidth size="sm" className="bg-surface-50/50">Manage</Button>
                          </Link>
                          <Link to={`/chat/new?kbId=${kb.id}`} className="flex-1">
                            <Button variant="primary" icon={<Sparkles className="w-3.5 h-3.5" />} fullWidth size="sm">
                              Agent Chat
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-16 glass-elevated border border-dashed border-surface-300 rounded-3xl text-center">
                  <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                   <Database className="w-10 h-10 text-surface-400" />
                  </div>
                  <h3 className="heading-3 mb-2">
                    {searchTerm ? 'No matches found' : 'Workspace is empty'}
                  </h3>
                  <p className="text-surface-500 max-w-md mb-8">
                    {!searchTerm && 'Create your first knowledge base to start uploading documents and generating AI support agents.'}
                    {searchTerm && `We couldn't find any knowledge bases matching "${searchTerm}".`}
                  </p>
                  {!searchTerm && (
                    <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
                      Create Knowledge Base
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Chats */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between pb-2 border-b border-surface-200">
                    <h3 className="heading-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary-500" />
                      Chat History
                    </h3>
                 </div>
                 
                 {recentChats.length > 0 ? (
                  <div className="space-y-3">
                    {recentChats.map((chat, idx) => (
                      <Link key={idx} to={`/chat/${chat.id}`} className="block group">
                        <div className="p-4 bg-card border border-surface-200/50 rounded-xl hover:border-primary-300/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div>
                               <p className="font-semibold text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">{chat.title || 'Support Request'}</p>
                               <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md bg-surface-100 text-[10px] font-semibold text-surface-500 uppercase">
                                  <Database className="w-3 h-3" />
                                  {chat.kb?.title || 'General'}
                               </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-surface-50 border border-surface-200 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 group-hover:border-primary-200 transition-colors">
                              <ArrowRightIcon className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-500" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link to="/chats">
                        <Button variant="ghost" fullWidth size="sm">See All History</Button>
                      </Link>
                    </div>
                  </div>
                 ) : (
                    <div className="p-8 text-center bg-surface-50/50 rounded-2xl border border-dashed border-surface-300">
                      <p className="text-surface-500 text-sm font-medium">No chat history available.</p>
                    </div>
                 )}
              </div>

              {/* Top Tickets */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between pb-2 border-b border-surface-200">
                    <h3 className="heading-4 flex items-center gap-2">
                      <TicketIcon className="w-5 h-5 text-amber-500" />
                      Recent Tickets
                    </h3>
                 </div>
                 
                 {tickets.length > 0 ? (
                   <div className="space-y-3">
                    {tickets.slice(0, 8).map((ticket) => (
                      <Link key={ticket.id} to={`/tickets?id=${ticket.id}`} className="block group">
                        <div className="p-4 bg-card border border-surface-200/50 rounded-xl hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)] transition-all duration-300 flex items-center gap-4">
                            
                            <div className={`w-2 h-10 rounded-full ${ticket.status === 'OPEN' ? 'bg-rose-500' : ticket.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            
                            <div className="flex-1 min-w-0">
                               <p className="font-semibold text-foreground group-hover:text-amber-600 transition-colors line-clamp-1">{ticket.title}</p>
                               <div className="flex items-center gap-3 mt-1.5">
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">{ticket.status.replace('_', ' ')}</span>
                                 <div className="w-1 h-1 rounded-full bg-surface-300"></div>
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">{ticket.priority} priority</span>
                               </div>
                            </div>
                        </div>
                      </Link>
                    ))}
                    <div className="pt-2">
                      <Link to="/tickets">
                        <Button variant="ghost" fullWidth size="sm">Go to Ticket Queue</Button>
                      </Link>
                    </div>
                  </div>
                 ) : (
                    <div className="p-8 text-center bg-surface-50/50 rounded-2xl border border-dashed border-surface-300">
                      <p className="text-surface-500 text-sm font-medium">No tickets in your queue.</p>
                    </div>
                 )}
              </div>
            </div>
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
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setNewTitle('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Initialize Vault
            </Button>
          </>
        }
      >
        <div className="space-y-6 pt-2">
          <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 flex items-start gap-3">
            <Database className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
              A knowledge base acts as the brain for your AI support agents. Once created, you can upload documentation, manuals, and FAQs.
            </p>
          </div>
          <Input
            label="Knowledge Base Name"
            type="text"
            placeholder="e.g. Acme API Documentation"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            helperText="Make it descriptive so agents know when to route herein."
          />
        </div>
      </Modal>
    </div>
  );
};

// SVG icons needed directly for the dashboard file scope
const ActivityIcon = (props: React.ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);
const ChevronRightIcon = (props: React.ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
);
const ArrowRightIcon = (props: React.ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const TicketIcon = (props: React.ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
);

export default Dashboard;
