import React, { useEffect, useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number;
  averageResolutionTime: number;
  slaCompliance: number;
  customerSatisfaction: number;
  ticketTrend: Array<{ date: string; count: number }>;
  teamPerformance: Array<{ agent: string; resolved: number; rating: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  slaBreach: number;
}

/**
 * Professional Admin Monitoring Dashboard
 * Real-time metrics, performance analytics, actionable insights
 */
export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-surface-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  const priorityColors = ['#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <MetricCard
          title="Total Tickets"
          value={metrics.totalTickets}
          icon={<CheckCircle2 className="w-6 h-6" />}
          trend="+12%"
          trendUp={true}
        />

        {/* Open Tickets */}
        <MetricCard
          title="Open Tickets"
          value={metrics.openTickets}
          icon={<AlertCircle className="w-6 h-6" />}
          trend={`${metrics.openTickets} pending`}
          trendUp={metrics.openTickets < 50}
        />

        {/* Avg Response Time */}
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.avgResponseTime}m`}
          icon={<Clock className="w-6 h-6" />}
          trend="-5% faster"
          trendUp={true}
        />

        {/* SLA Compliance */}
        <MetricCard
          title="SLA Compliance"
          value={`${metrics.slaCompliance}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={metrics.slaBreach ? `${metrics.slaBreach} breached` : 'On track'}
          trendUp={metrics.slaCompliance > 95}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Ticket Trend (7 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.priorityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.priorityDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={priorityColors[index % priorityColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-surface-700">Agent</th>
                  <th className="text-center py-3 px-4 font-semibold text-surface-700">Tickets Resolved</th>
                  <th className="text-center py-3 px-4 font-semibold text-surface-700">Rating</th>
                  <th className="text-center py-3 px-4 font-semibold text-surface-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.teamPerformance.map((agent, idx) => (
                  <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 text-surface-900 font-medium">{agent.agent}</td>
                    <td className="py-3 px-4 text-center text-surface-700">{agent.resolved}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${i < Math.round(agent.rating) ? 'text-yellow-400' : 'text-surface-400'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        agent.rating >= 4.5
                          ? 'bg-green-100 text-green-800'
                          : agent.rating >= 3.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {agent.rating >= 4.5 ? 'Excellent' : agent.rating >= 3.5 ? 'Good' : 'Needs Help'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Satisfaction */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-surface-900">Customer Satisfaction</h3>
            <p className="text-surface-600 text-sm mt-1">Based on last 100 tickets</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary-600">{metrics.customerSatisfaction}%</div>
            <div className="text-sm text-surface-600">Overall CSAT</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-surface-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-400 to-primary-600 transition-all duration-300"
            style={{ width: `${metrics.customerSatisfaction}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-surface-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-surface-900 mt-2">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 font-semibold ${trendUp ? 'text-accent-500' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className="text-surface-400">{icon}</div>
    </div>
  </div>
);

export default AdminDashboard;
