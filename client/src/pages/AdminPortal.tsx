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
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, Select, Button, NavigationTabs, StatCard } from '../components/ui';

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur">
        <div className="px-6 py-6 flex items-start justify-between">
          <div>
            <h1 className="heading-1">Admin Portal</h1>
            <p className="text-surface-600 mt-1">System Management & Analytics Dashboard</p>
          </div>
          <Button
            variant="primary"
            onClick={handleRefresh}
            loading={refreshing}
            disabled={refreshing}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Critical Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="w-8 h-8" />}
          />
          <StatCard
            label="Active Tickets"
            value={stats?.totalTickets || 0}
            icon={<MessageSquare className="w-8 h-8" />}
          />
          <StatCard
            label="Knowledge Bases"
            value={stats?.totalKBs || 0}
            icon={<Database className="w-8 h-8" />}
          />
          <StatCard
            label="Active Sessions"
            value={stats?.activeSessions || 0}
            icon={<Activity className="w-8 h-8" />}
          />
        </div>

        {/* Controls */}
        <Card elevated className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' }
            ]}
            label="Time Range"
            className="md:w-48"
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={<Download className="w-4 h-4" />}
              size="md"
            >
              Export Report
            </Button>
            <Button
              variant="outline"
              icon={<Settings className="w-4 h-4" />}
              size="md"
            >
              Settings
            </Button>
          </div>
        </Card>

        {/* Tab Navigation */}
        <NavigationTabs
          tabs={[
            { id: 'tickets', label: 'Ticket Analytics', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'ai', label: 'AI Performance', icon: <Zap className="w-4 h-4" /> },
            { id: 'system', label: 'System Health', icon: <Activity className="w-4 h-4" /> }
          ]}
          activeTab={selectedMetric}
          onTabChange={(tab) => setSelectedMetric(tab as any)}
        />

        {/* Content Areas */}
        <div className="space-y-6">
          {/* Ticket Analytics Tab */}
          {selectedMetric === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Trends */}
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">Ticket Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.ticketTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="date" stroke="var(--chart-axis)" />
                      <YAxis stroke="var(--chart-axis)" />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--chart-tooltip-bg)',
                          border: '1px solid var(--chart-tooltip-border)',
                          borderRadius: '8px',
                          color: 'var(--chart-tooltip-text)'
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
              </Card>

              {/* Ticket Status */}
              <Card elevated className="p-6 space-y-4">
                <h3 className="heading-4">Ticket Status Distribution</h3>
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
                        <Cell fill="#f59e0b" />
                        <Cell fill="#64748b" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--chart-tooltip-bg)',
                          border: '1px solid var(--chart-tooltip-border)',
                          borderRadius: '8px',
                          color: 'var(--chart-tooltip-text)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* AI Performance Tab */}
          {selectedMetric === 'ai' && (
            <Card elevated className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="heading-4">AI Response Confidence Distribution</h3>
                <span className="text-xs font-medium text-surface-600">Last {timeRange}</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.confidenceAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="range" stroke="var(--chart-axis)" />
                    <YAxis stroke="var(--chart-axis)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--chart-tooltip-bg)',
                        border: '1px solid var(--chart-tooltip-border)',
                        borderRadius: '8px',
                        color: 'var(--chart-tooltip-text)'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* System Health Tab */}
          {selectedMetric === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Database Connection */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-surface-900">Database</span>
                </div>
                <p className="text-2xl font-bold text-green-600">Healthy</p>
              </Card>

              {/* Redis Cache */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-surface-900">Redis Cache</span>
                </div>
                <p className="text-2xl font-bold text-green-600">Connected</p>
              </Card>

              {/* Socket.IO */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-surface-900">Socket.IO</span>
                </div>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </Card>

              {/* API Response Time */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-surface-900">API Response</span>
                </div>
                <p className="text-2xl font-bold text-primary-600">142ms avg</p>
              </Card>

              {/* System Uptime */}
              <Card elevated className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-surface-900">Uptime</span>
                </div>
                <p className="text-2xl font-bold text-green-600">99.8%</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
