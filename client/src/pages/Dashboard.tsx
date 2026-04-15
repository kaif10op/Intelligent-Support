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
  Loader2,
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-40">
        <div className="px-6 py-6 space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">
                <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                Workspace overview
              </div>
              <h1 className="heading-1">Dashboard</h1>
              <p className="text-surface-600 max-w-2xl">
                A clean operational view of your knowledge bases, conversations, and support activity.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => fetchData(false)}
                loading={refreshing}
                disabled={refreshing}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setShowModal(true)}
              >
                New KB
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-surface-500">Knowledge bases</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="text-3xl font-bold text-surface-900">{kbs.length}</div>
                <Database className="w-5 h-5 text-primary-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-surface-500">Recent chats</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="text-3xl font-bold text-surface-900">{recentChats.length}</div>
                <MessageSquare className="w-5 h-5 text-primary-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-surface-500">Open tickets</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="text-3xl font-bold text-surface-900">{ticketStats.open}</div>
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-surface-500">Workflow status</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div className="text-lg font-semibold text-surface-900">{refreshing ? 'Updating' : 'Ready'}</div>
                <Sparkles className="w-5 h-5 text-secondary-500" />
              </div>
            </div>
          </div>

        {/* Tab Navigation */}
        <div className="border-t border-border pt-4">
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
      <div className="px-6 py-6 space-y-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total KBs"
                value={kbs.length}
                icon={<Database className="w-8 h-8" />}
              />
              <StatCard
                label="Total Chats"
                value={recentChats.length}
                icon={<MessageSquare className="w-8 h-8" />}
              />
              <StatCard
                label="Open Tickets"
                value={ticketStats.open}
                icon={<AlertCircle className="w-8 h-8" />}
              />
              <StatCard
                label="Resolved"
                value={ticketStats.resolved}
                icon={<CheckCircle className="w-8 h-8" />}
              />
            </div>

            {/* Ticket Status Cards */}
            {tickets.length > 0 && (
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">Ticket status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Link to="/tickets?status=open">
                    <div className="p-4 border border-surface-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer">
                      <p className="text-xs text-surface-600">Open</p>
                      <p className="text-2xl font-bold text-surface-900">{ticketStats.open}</p>
                    </div>
                  </Link>
                  <Link to="/tickets?status=in-progress">
                    <div className="p-4 border border-surface-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer">
                      <p className="text-xs text-surface-600">In Progress</p>
                      <p className="text-2xl font-bold text-surface-900">{ticketStats.inProgress}</p>
                    </div>
                  </Link>
                  <Link to="/tickets?status=resolved">
                    <div className="p-4 border border-surface-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer">
                      <p className="text-xs text-surface-600">Resolved</p>
                      <p className="text-2xl font-bold text-surface-900">{ticketStats.resolved}</p>
                    </div>
                  </Link>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card elevated className="p-6 space-y-4">
              <h3 className="heading-4">Quick actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowModal(true)}
                >
                  New KB
                </Button>
                <Link to="/chat/new" className="block">
                  <Button variant="outline" fullWidth icon={<MessageSquare className="w-4 h-4" />}>
                    New Chat
                  </Button>
                </Link>
                <Link to="/tickets" className="block">
                  <Button variant="outline" fullWidth icon={<AlertCircle className="w-4 h-4" />}>
                    View Tickets
                  </Button>
                </Link>
                <Link to="/search" className="block">
                  <Button variant="outline" fullWidth icon={<Search className="w-4 h-4" />}>
                    Search
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Knowledge Bases Tab */}
        {activeTab === 'knowledge-bases' && (
          <div className="space-y-6">
            {/* Controls */}
            <Card elevated className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Search knowledge bases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="flex-1"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="recent">Sort: Recent</option>
                  <option value="name">Sort: Name</option>
                  <option value="docs">Sort: Documents</option>
                </select>
              </div>
            </Card>

            {/* KB Grid */}
            {filteredKbs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKbs.map((kb) => (
                  <Card elevated key={kb.id} className="p-6 flex flex-col hover:shadow-md transition-shadow">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Database className="w-6 h-6 text-primary-500" />
                      </div>
                      <button
                        onClick={() => handleDelete(kb.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-surface-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-semibold text-surface-900 mb-1 line-clamp-2">{kb.title}</h3>
                    <p className="text-sm text-surface-600 mb-4 line-clamp-2 flex-1">
                      {kb.description || 'No description'}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-4 mb-4 text-xs text-surface-600 border-t border-surface-200 pt-4">
                      <div className="flex items-center gap-1.5">
                        <Files className="w-4 h-4" />
                        <span>{kb._count?.documents || 0} documents</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>{kb._count?.chats || 0} chats</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link to={`/kb/${kb.id}`} className="flex-1">
                        <Button variant="outline" fullWidth size="sm">Manage</Button>
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
                <p className="text-surface-600 font-medium">
                  {searchTerm ? 'No knowledge bases match your search' : 'No knowledge bases yet'}
                </p>
                <p className="text-sm text-surface-500 mt-2">
                  {!searchTerm && 'Create a knowledge base to start organizing support content'}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Recent Chats */}
            {recentChats.length > 0 ? (
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">Recent conversations</h3>
                <div className="space-y-3">
                  {recentChats.map((chat, idx) => (
                    <Link key={idx} to={`/chat/${chat.id}`}>
                      <div className="p-4 border border-surface-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-surface-900 truncate">{chat.title || 'Untitled Chat'}</p>
                          <p className="text-xs text-surface-600 mt-1">{chat.kb?.title}</p>
                        </div>
                        <MessageSquare className="w-4 h-4 text-primary-500 flex-shrink-0 ml-4" />
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/chats" className="block">
                  <Button variant="outline" fullWidth>View All Conversations</Button>
                </Link>
              </Card>
            ) : (
              <Card elevated className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                <p className="text-surface-600">No recent conversations yet</p>
              </Card>
            )}

            {/* Top Tickets */}
            {tickets.length > 0 && (
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">Recent support tickets</h3>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket) => (
                    <Link key={ticket.id} to={`/tickets?id=${ticket.id}`}>
                      <div className="p-4 border border-surface-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-surface-900 truncate">{ticket.title}</p>
                          <p className="text-xs text-surface-600 mt-1 flex gap-2">
                            <span>{ticket.status}</span>
                            {ticket.priority && <span>•</span>}
                            <span>{ticket.priority} priority</span>
                          </p>
                        </div>
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 ml-4" />
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/tickets" className="block">
                  <Button variant="outline" fullWidth>View All Tickets</Button>
                </Link>
              </Card>
            )}
          </div>
        )}
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
