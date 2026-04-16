import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, AlertCircle, CheckCircle, Loader2, BarChart2, Activity, Zap } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, StatCard, Section } from '../components/ui';

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

  const COLORS = [
    'var(--chart-color-1)',
    'var(--chart-color-2)',
    'var(--chart-color-3)',
    'var(--chart-color-4)'
  ];

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent page-enter gap-4">
         <div className="relative">
           <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
           <div className="relative bg-card p-4 rounded-full shadow-lg border border-primary-500/20">
              <Loader2 size={32} className="animate-spin text-primary-500" />
           </div>
         </div>
         <p className="text-[12px] text-surface-500 font-bold uppercase tracking-widest animate-pulse mt-2">Loading Telemetry</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center page-enter">
          <Card elevated className="p-12 text-center max-w-lg border border-rose-500/20 bg-rose-500/5">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <p className="heading-3 text-foreground mb-2">Telemetry Offline</p>
            <p className="text-surface-500 font-medium">Failed to retrieve network analytics payload.</p>
          </Card>
      </div>
    );
  }

  const chartData = Object.entries(analytics.conversationsByDate || {})
    .slice(-30)
    .map(([date, count]) => ({ date, conversations: count }));

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Decorative Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[20%] left-[10%] w-[30%] h-[400px] bg-gradient-to-r from-purple-500/5 to-transparent blur-[120px] rounded-full"></div>
      </div>

      {/* Floating Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-40 transition-all">
        <div className="px-6 py-6 md:py-8 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-center shadow-sm">
                <BarChart2 className="w-6 h-6 text-purple-600 drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
             </div>
             <div>
               <h1 className="heading-1 tracking-tight pr-4">Global Analytics</h1>
               <p className="text-sm text-surface-500 font-medium">Platform throughput and agent efficiency metrics</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 px-6 py-10 overflow-y-auto w-full relative z-10">
        <div className="max-w-[1400px] mx-auto pb-12 animate-fade-in-up">
          
          {/* KPI Matrix */}
          <Section title="Live Throughput Metrics" subtitle="Core volume and feedback indices">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
               <StatCard
                 label="Total Interactions"
                 value={analytics.messageStats?.total || 0}
                 icon={<MessageSquare className="w-6 h-6 text-purple-500 drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" />}
                 trend={{ direction: 'up', value: 0 }}
               />
               <StatCard
                 label="Support Threads"
                 value={analytics.ticketStats?.total || 0}
                 icon={<AlertCircle className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                 trend={{ direction: 'up', value: 0 }}
               />
               <StatCard
                 label="Average Copilot Precision"
                 value={`${analytics.avgConfidence || 0}%`}
                 icon={<TrendingUp className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                 trend={{ direction: 'up', value: 0 }}
               />
               <StatCard
                 label="Positive Resonance"
                 value={`${analytics.feedbackStats?.positivePercentage || 0}%`}
                 icon={<CheckCircle className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                 trend={{ direction: 'up', value: 0 }}
               />
             </div>
          </Section>

          {/* Graphics Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card elevated className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><Activity size={18}/></div>
                 <h3 className="heading-4">Thread Status Topology</h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Open Queue', value: analytics.ticketStats?.open || 0 },
                        { name: 'Processing', value: analytics.ticketStats?.inProgress || 0 },
                        { name: 'Resolved', value: analytics.ticketStats?.resolved || 0 },
                        { name: 'Closed', value: analytics.ticketStats?.closed || 0 }
                      ]}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4}
                      fill="var(--chart-color-1)" dataKey="value" stroke="none"
                    >
                      {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                      itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card elevated className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><AlertCircle size={18}/></div>
                 <h3 className="heading-4">Urgency Distribution Matrix</h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(analytics.priorityDistribution || {}).map(([name, value]) => ({ name, value }))} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                      cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                      itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    />
                    <Bar dataKey="value" fill="var(--chart-color-2)" name="Thread Count" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Graphics Row 2 - Full Span */}
          <Card elevated className="p-8 space-y-6 mb-8">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><TrendingUp size={18}/></div>
               <h3 className="heading-4">30-Day Conversation Velocity</h3>
            </div>
            <div className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                   <XAxis dataKey="date" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                   <YAxis stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip
                     contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                     itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                   />
                   <Legend verticalAlign="top" height={40} wrapperStyle={{ paddingBottom: '20px' }} />
                   <Line type="monotone" dataKey="conversations" stroke="var(--chart-color-1)" strokeWidth={3} dot={{ fill: 'var(--chart-color-1)', r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Message Volume" />
                 </LineChart>
               </ResponsiveContainer>
            </div>
          </Card>

          {/* Bottom Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Origin Slice */}
            <Card elevated className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Zap size={18}/></div>
                 <h3 className="heading-4">Compute vs Manual Origin</h3>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Synthetic / AI Generation', value: analytics.messageStats?.aiMessages || 0 },
                        { name: 'Human / Manual Input', value: analytics.messageStats?.userMessages || 0 }
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill="var(--chart-color-1)" />
                      <Cell fill="var(--chart-color-3)" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                      itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* SLA Assessment */}
            <Card elevated className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><AlertCircle size={18}/></div>
                 <h3 className="heading-4">SLA Delivery Assessment</h3>
              </div>
              
              <div className="grid gap-6">
                {/* Overdue */}
                <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className="p-1.5 rounded-md bg-rose-500/10"><AlertCircle className="w-4 h-4 text-rose-600" /></div>
                    <span className="text-[12px] font-bold uppercase tracking-widest text-surface-600">Breached SLA Limit</span>
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                    <p className="text-4xl font-black text-rose-600 tracking-tight">{analytics.overdueStats?.count || 0}</p>
                    <p className="text-[13px] font-bold text-rose-700/70 pb-1">Violating avg {analytics.overdueStats?.avgDaysOverdue || 0}d</p>
                  </div>
                </div>

                {/* On-Time */}
                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className="p-1.5 rounded-md bg-emerald-500/10"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
                    <span className="text-[12px] font-bold uppercase tracking-widest text-surface-600">Compliant Resolution</span>
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                    <p className="text-4xl font-black text-emerald-600 tracking-tight">{(analytics.ticketStats?.total || 0) - (analytics.overdueStats?.count || 0)}</p>
                    <p className="text-[13px] font-bold text-emerald-700/70 pb-1">
                      {((((analytics.ticketStats?.total - analytics.overdueStats?.count) / (analytics.ticketStats?.total || 1)) * 100) || 0).toFixed(1)}% cleared safely
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
