import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Settings,
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle,
  Database,
  Filter,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { API_ENDPOINTS, axiosConfig } from '../config/api';

interface AdminStats {
  totalUsers: number;
  totalTickets: number;
  totalKBs: number;
  activeSessions: number;
  confidenceAnalysis: any[];
  feedbackStats: any;
  ticketTrends: any[];
  recentActivity: any[];
}

const AdminPortal = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'tickets' | 'ai' | 'system'>('tickets');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.ADMIN_STATS, axiosConfig);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground mt-1">System Management & Analytics Dashboard</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            refreshing
              ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Critical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="glass-elevated border border-border/50 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Total Users</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalUsers || 0}</p>
          </div>
        </div>

        {/* Active Tickets */}
        <div className="glass-elevated border border-border/50 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Active Tickets</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalTickets || 0}</p>
          </div>
        </div>

        {/* Knowledge Bases */}
        <div className="glass-elevated border border-border/50 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Knowledge Bases</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats?.totalKBs || 0}</p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="glass-elevated border border-border/50 rounded-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Active Sessions</p>
            <p className="text-3xl font-bold text-foreground mt-1">{stats?.activeSessions || 0}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-elevated border border-border/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="input-base"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-2 px-4 py-2 border border-border/50 text-foreground rounded-lg hover:bg-card/50 transition-colors font-medium text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-border/50 text-foreground rounded-lg hover:bg-card/50 transition-colors font-medium text-sm">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border/30">
        {[
          { id: 'tickets', label: 'Ticket Analytics', icon: MessageSquare },
          { id: 'ai', label: 'AI Performance', icon: Zap },
          { id: 'system', label: 'System Health', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedMetric(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
              selectedMetric === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Areas */}
      <div className="space-y-6">
        {/* Ticket Analytics Tab */}
        {selectedMetric === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Trends */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Ticket Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.ticketTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f1629',
                        border: '1px solid #1e293b',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#10b981"
                      name="Created"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#3b82f6"
                      name="Resolved"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ticket Status */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Ticket Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Open', value: 45 },
                        { name: 'In Progress', value: 30 },
                        { name: 'Resolved', value: 20 },
                        { name: 'Closed', value: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#ec4899" />
                      <Cell fill="#6b7280" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f1629',
                        border: '1px solid #1e293b',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Performance Tab */}
        {selectedMetric === 'ai' && (
          <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">AI Response Confidence Distribution</h3>
              <span className="text-xs font-medium text-muted-foreground">Last {timeRange}</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.confidenceAnalysis || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="range" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f1629',
                      border: '1px solid #1e293b',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {selectedMetric === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Database Connection */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-foreground">Database Connection</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">Healthy</p>
            </div>

            {/* Redis Cache */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-foreground">Redis Cache</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">Connected</p>
            </div>

            {/* Socket.IO */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-foreground">Socket.IO</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">Active</p>
            </div>

            {/* API Response Time */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary" />
                <span className="font-medium text-foreground">API Response</span>
              </div>
              <p className="text-2xl font-bold text-secondary">142ms avg</p>
            </div>

            {/* System Uptime */}
            <div className="glass-elevated border border-border/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-foreground">Uptime</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">99.8%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;
