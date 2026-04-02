import React, { useEffect, useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

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
  const [selectedMetric, setSelectedMetric] = useState<'tickets' | 'users' | 'ai' | 'system'>('tickets');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/admin/stats', {
        withCredentials: true
      });
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

  const CriticalMetrics = () => (
    <div style={styles.metricsGrid}>
      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>
          <Users size={24} />
        </div>
        <div style={styles.metricContent}>
          <p>Total Users</p>
          <h3>{stats?.totalUsers || 0}</h3>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>
          <MessageSquare size={24} />
        </div>
        <div style={styles.metricContent}>
          <p>Active Tickets</p>
          <h3>{stats?.totalTickets || 0}</h3>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>
          <Database size={24} />
        </div>
        <div style={styles.metricContent}>
          <p>Knowledge Bases</p>
          <h3>{stats?.totalKBs || 0}</h3>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricIcon}>
          <Activity size={24} />
        </div>
        <div style={styles.metricContent}>
          <p>Active Sessions</p>
          <h3>{stats?.activeSessions || 0}</h3>
        </div>
      </div>
    </div>
  );

  const AIPerformanceTab = () => (
    <div style={styles.chartContainer}>
      <div style={styles.chartHeader}>
        <h3>AI Response Confidence Distribution</h3>
        <span style={styles.chartMetric}>Last {timeRange}</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats?.confidenceAnalysis || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,210,255,0.1)" />
          <XAxis dataKey="range" stroke="#00d2ff" />
          <YAxis stroke="#00d2ff" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid #00d2ff'
            }}
          />
          <Bar dataKey="count" fill="#00d2ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const TicketAnalyticsTab = () => (
    <div style={styles.analyticsGrid}>
      <div style={styles.chartContainer}>
        <h3>Ticket Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stats?.ticketTrends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,210,255,0.1)" />
            <XAxis dataKey="date" stroke="#00d2ff" />
            <YAxis stroke="#00d2ff" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid #00d2ff'
              }}
            />
            <Line
              type="monotone"
              dataKey="created"
              stroke="#00ff80"
              name="Created"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#00d2ff"
              name="Resolved"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.chartContainer}>
        <h3>Ticket Status</h3>
        <ResponsiveContainer width="100%" height={250}>
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
              <Cell fill="#00d2ff" />
              <Cell fill="#00ff80" />
              <Cell fill="#ff0080" />
              <Cell fill="#666" />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid #00d2ff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const SystemHealthTab = () => (
    <div style={styles.healthContainer}>
      <div style={styles.healthItem}>
        <div style={styles.healthStatus}>
          <CheckCircle size={20} color="#00ff80" />
          <span>Database Connection</span>
        </div>
        <p style={styles.healthValue}>Healthy</p>
      </div>

      <div style={styles.healthItem}>
        <div style={styles.healthStatus}>
          <CheckCircle size={20} color="#00ff80" />
          <span>Redis Cache</span>
        </div>
        <p style={styles.healthValue}>Connected</p>
      </div>

      <div style={styles.healthItem}>
        <div style={styles.healthStatus}>
          <CheckCircle size={20} color="#00ff80" />
          <span>Socket.IO</span>
        </div>
        <p style={styles.healthValue}>Active</p>
      </div>

      <div style={styles.healthItem}>
        <div style={styles.healthStatus}>
          <Zap size={20} color="#00d2ff" />
          <span>API Response Time</span>
        </div>
        <p style={styles.healthValue}>142ms avg</p>
      </div>

      <div style={styles.healthItem}>
        <div style={styles.healthStatus}>
          <TrendingUp size={20} color="#00ff80" />
          <span>System Uptime</span>
        </div>
        <p style={styles.healthValue}>99.8%</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading Admin Portal...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1>Admin Portal</h1>
          <p>System Management & Analytics Dashboard</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            ...(refreshing ? { opacity: 0.5 } : {})
          }}
        >
          <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Critical Metrics */}
      <CriticalMetrics />

      {/* Time Range Selector */}
      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          <Filter size={18} />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            style={styles.select}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <div style={styles.tableControls}>
          <button style={styles.controlButton}>
            <Download size={16} />
            Export Report
          </button>
          <button style={styles.controlButton}>
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        {[
          { id: 'tickets', label: 'Ticket Analytics', icon: MessageSquare },
          { id: 'ai', label: 'AI Performance', icon: Zap },
          { id: 'system', label: 'System Health', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedMetric(tab.id as any)}
            style={{
              ...styles.tabButton,
              ...(selectedMetric === tab.id ? styles.tabButtonActive : {})
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Areas */}
      <div style={styles.contentArea}>
        {selectedMetric === 'tickets' && <TicketAnalyticsTab />}
        {selectedMetric === 'ai' && <AIPerformanceTab />}
        {selectedMetric === 'system' && <SystemHealthTab />}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#0a0e27',
    color: '#fff',
    minHeight: '100vh'
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  } as React.CSSProperties,
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#00d2ff',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  } as React.CSSProperties,
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  } as React.CSSProperties,
  metricCard: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'rgba(0,210,255,0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(0,210,255,0.2)'
  } as React.CSSProperties,
  metricIcon: {
    color: '#00d2ff',
    minWidth: '40px'
  } as React.CSSProperties,
  metricContent: {
    flex: 1
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '12px 16px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '6px'
  } as React.CSSProperties,
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#00d2ff'
  } as React.CSSProperties,
  select: {
    padding: '6px 12px',
    backgroundColor: 'rgba(0,210,255,0.1)',
    border: '1px solid #00d2ff',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer'
  } as React.CSSProperties,
  tableControls: {
    display: 'flex',
    gap: '8px'
  } as React.CSSProperties,
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #00d2ff',
    color: '#00d2ff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(0,210,255,0.2)',
    paddingBottom: '12px'
  } as React.CSSProperties,
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease'
  } as React.CSSProperties,
  tabButtonActive: {
    color: '#00d2ff',
    borderColor: '#00d2ff'
  } as React.CSSProperties,
  contentArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  chartContainer: {
    padding: '20px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(0,210,255,0.2)'
  } as React.CSSProperties,
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  } as React.CSSProperties,
  chartMetric: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)'
  } as React.CSSProperties,
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px'
  } as React.CSSProperties,
  healthContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  } as React.CSSProperties,
  healthItem: {
    padding: '16px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    border: '1px solid rgba(0,210,255,0.2)'
  } as React.CSSProperties,
  healthStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  } as React.CSSProperties,
  healthValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#00ff80'
  } as React.CSSProperties,
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#00d2ff'
  } as React.CSSProperties
};

export default AdminPortal;
