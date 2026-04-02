import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const AnalyticsDashboard = () => {
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/admin/analytics', {
          withCredentials: true
        });
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
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-elevated border border-border/50 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-foreground font-semibold">Failed to load analytics data</p>
      </div>
    );
  }

  const COLORS = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  // Prepare chart data from conversationsByDate
  const chartData = Object.entries(analytics.conversationsByDate || {})
    .slice(-30) // Last 30 days
    .map(([date, count]) => ({ date, conversations: count }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">System performance and user engagement metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{analytics.messageStats?.total || 0}</p>
            <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Total Messages</p>
            <p className="text-sm text-secondary font-medium mt-2">{analytics.messageStats?.aiPercentage || 0}% AI-generated</p>
          </div>
        </div>

        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{analytics.ticketStats?.total || 0}</p>
            <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Support Tickets</p>
            <p className="text-sm text-destructive font-medium mt-2">{analytics.ticketStats?.overdue || 0} overdue</p>
          </div>
        </div>

        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{analytics.avgConfidence || '0'}</p>
            <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Avg Confidence</p>
            <p className="text-sm text-muted-foreground font-medium mt-2">AI Response Quality</p>
          </div>
        </div>

        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{analytics.feedbackStats?.positivePercentage || 0}%</p>
            <p className="text-xs text-muted-foreground uppercase font-medium mt-1">Positive Feedback</p>
            <p className="text-sm text-muted-foreground font-medium mt-2">{analytics.feedbackStats?.positive || 0}/{analytics.feedbackStats?.total || 0} ratings</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Distribution */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Ticket Status Distribution</h3>
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
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Ticket Priority Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(analytics.priorityDistribution || {}).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#a0aec0" />
                <YAxis stroke="#a0aec0" />
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#ec4899" name="Count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversations Over Time - Full Width */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground">Conversations Over 30 Days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#a0aec0" />
                <YAxis stroke="#a0aec0" />
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="conversations" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#ec4899', r: 4 }} name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI vs User Messages */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">AI vs User Messages</h3>
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
                  <Cell fill="#ec4899" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Performance */}
        <div className="glass-elevated border border-border/50 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-foreground">SLA Performance</h3>

          {/* Overdue Tickets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-foreground">Overdue Tickets</span>
            </div>
            <p className="text-3xl font-bold text-destructive">{analytics.overdueStats?.count || 0}</p>
            <p className="text-xs text-muted-foreground">Avg {analytics.overdueStats?.avgDaysOverdue || 0}d overdue</p>
          </div>

          <div className="h-px bg-border/30" />

          {/* On-Time Tickets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">On-Time Tickets</span>
            </div>
            <p className="text-3xl font-bold text-emerald-500">{(analytics.ticketStats?.total || 0) - (analytics.overdueStats?.count || 0)}</p>
            <p className="text-xs text-muted-foreground">
              {((((analytics.ticketStats?.total - analytics.overdueStats?.count) / (analytics.ticketStats?.total || 1)) * 100) || 0).toFixed(1)}% on-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
