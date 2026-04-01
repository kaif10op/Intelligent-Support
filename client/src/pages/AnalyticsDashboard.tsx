import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { SkeletonCard } from '../components/Skeleton';

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
      <div className="analytics-page">
        <h1>Analytics Dashboard</h1>
        <div className="stats-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass stat-card" style={{ padding: '20px' }}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="error-msg">Failed to load analytics data</div>;
  }

  const COLORS = ['#8a2be2', '#00d2ff', '#4ade80', '#ffa500'];

  // Prepare chart data from conversationsByDate
  const chartData = Object.entries(analytics.conversationsByDate || {})
    .slice(-30) // Last 30 days
    .map(([date, count]) => ({ date, conversations: count }));

  return (
    <div className="analytics-page fade-in">
      <header className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>System performance and user engagement metrics</p>
      </header>

      {/* KPIs */}
      <div className="stats-grid">
        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: '#8a2be2' }}>
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics.messageStats?.total || 0}</div>
            <div className="stat-label">Total Messages</div>
            <div className="stat-detail" style={{ color: '#00d2ff' }}>
              {analytics.messageStats?.aiPercentage}% AI-generated
            </div>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: '#4ade80' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics.ticketStats?.total || 0}</div>
            <div className="stat-label">Support Tickets</div>
            <div className="stat-detail" style={{ color: '#ff6464' }}>
              {analytics.ticketStats?.overdue} overdue
            </div>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: '#ffa500' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics.avgConfidence}</div>
            <div className="stat-label">Avg Confidence</div>
            <div className="stat-detail">AI Response Quality</div>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon" style={{ color: '#00d2ff' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics.feedbackStats?.positivePercentage}%</div>
            <div className="stat-label">Positive Feedback</div>
            <div className="stat-detail">
              {analytics.feedbackStats?.positive}/{analytics.feedbackStats?.total} ratings
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Ticket Status Distribution */}
        <div className="glass chart-card">
          <h3>Ticket Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Open', value: analytics.ticketStats?.open },
                  { name: 'In Progress', value: analytics.ticketStats?.inProgress },
                  { name: 'Resolved', value: analytics.ticketStats?.resolved },
                  { name: 'Closed', value: analytics.ticketStats?.closed }
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="glass chart-card">
          <h3>Ticket Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(analytics.priorityDistribution || {}).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip />
              <Bar dataKey="value" fill="#8a2be2" name="Count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversations Over Time */}
        <div className="glass chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Conversations Over 30 Days</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversations" stroke="#00d2ff" strokeWidth={2} dot={{ fill: '#8a2be2', r: 4 }} name="Messages" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI vs User Messages */}
        <div className="glass chart-card">
          <h3>AI vs User Messages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'AI', value: analytics.messageStats?.aiMessages },
                  { name: 'User', value: analytics.messageStats?.userMessages }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#8a2be2" />
                <Cell fill="#00d2ff" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Performance */}
        <div className="glass chart-card">
          <h3>SLA Performance</h3>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sla-stat">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={20} style={{ color: '#ff6464' }} />
                <span>Overdue Tickets</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6464' }}>
                {analytics.overdueStats?.count}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Avg {analytics.overdueStats?.avgDaysOverdue}d overdue
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            <div className="sla-stat">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={20} style={{ color: '#4ade80' }} />
                <span>On-Time Tickets</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>
                {analytics.ticketStats?.total - analytics.overdueStats?.count}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {((((analytics.ticketStats?.total - analytics.overdueStats?.count) / (analytics.ticketStats?.total || 1)) * 100) || 0).toFixed(1)}% on-time
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .analytics-header {
          margin-bottom: 16px;
        }

        .analytics-header h1 {
          font-size: 2rem;
          margin: 0 0 8px 0;
          color: #fff;
        }

        .analytics-header p {
          color: var(--text-muted);
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .stat-card {
          display: flex;
          align-items: stretch;
          gap: 16px;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          opacity: 0.8;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-detail {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 16px;
        }

        .chart-card {
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chart-card h3 {
          margin: 0 0 16px 0;
          font-size: 1.1rem;
          color: #fff;
        }

        .sla-stat {
          padding: 12px 0;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .chart-card {
            grid-column: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
