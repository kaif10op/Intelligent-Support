import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, StatCard } from '../components/ui';

const AnalyticsDashboard = () => {
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.ADMIN_ANALYTICS, axiosConfig);
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        addToast('Failed to load analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [addToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-surface-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-6 py-6">
          <Card elevated className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-surface-900 font-semibold">Failed to load analytics data</p>
          </Card>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const chartData = Object.entries(analytics.conversationsByDate || {})
    .slice(-30)
    .map(([date, count]) => ({ date, conversations: count }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <h1 className="heading-1">Analytics Dashboard</h1>
          <p className="text-surface-600 mt-1">System performance and user engagement metrics</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Messages"
            value={analytics.messageStats?.total || 0}
            icon={<MessageSquare className="w-8 h-8" />}
          />
          <StatCard
            label="Support Tickets"
            value={analytics.ticketStats?.total || 0}
            icon={<AlertCircle className="w-8 h-8" />}
          />
          <StatCard
            label="Avg Confidence"
            value={`${analytics.avgConfidence || 0}%`}
            icon={<TrendingUp className="w-8 h-8" />}
          />
          <StatCard
            label="Positive Feedback"
            value={`${analytics.feedbackStats?.positivePercentage || 0}%`}
            icon={<CheckCircle className="w-8 h-8" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Status Distribution */}
          <Card elevated className="p-6 space-y-4">
            <h3 className="heading-4">Ticket Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Open', value: analytics.ticketStats?.open || 0 },
                      { name: 'In Progress', value: analytics.ticketStats?.inProgress || 0 },
                      { name: 'Resolved', value: analytics.ticketStats?.resolved || 0 },
                      { name: 'Closed', value: analytics.ticketStats?.closed || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Priority Distribution */}
          <Card elevated className="p-6 space-y-4">
            <h3 className="heading-4">Ticket Priority Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(analytics.priorityDistribution || {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" stroke="#868e96" />
                  <YAxis stroke="#868e96" />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#3b82f6" name="Count" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Conversations Over Time - Full Width */}
          <Card elevated className="lg:col-span-2 p-6 space-y-4">
            <h3 className="heading-4">Conversations Over 30 Days</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" stroke="#868e96" />
                  <YAxis stroke="#868e96" />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="conversations" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Messages" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AI vs User Messages */}
          <Card elevated className="p-6 space-y-4">
            <h3 className="heading-4">AI vs User Messages</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'AI', value: analytics.messageStats?.aiMessages || 0 },
                      { name: 'User', value: analytics.messageStats?.userMessages || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e9ecef', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* SLA Performance */}
          <Card elevated className="p-6 space-y-6">
            <h3 className="heading-4">SLA Performance</h3>

            {/* Overdue Tickets */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-surface-900">Overdue Tickets</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{analytics.overdueStats?.count || 0}</p>
              <p className="text-xs text-surface-600">Avg {analytics.overdueStats?.avgDaysOverdue || 0}d overdue</p>
            </div>

            <div className="h-px bg-surface-200" />

            {/* On-Time Tickets */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-surface-900">On-Time Tickets</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{(analytics.ticketStats?.total || 0) - (analytics.overdueStats?.count || 0)}</p>
              <p className="text-xs text-surface-600">
                {((((analytics.ticketStats?.total - analytics.overdueStats?.count) / (analytics.ticketStats?.total || 1)) * 100) || 0).toFixed(1)}% on-time
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
