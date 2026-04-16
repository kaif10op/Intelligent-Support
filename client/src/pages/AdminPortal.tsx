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
  TrendingUp,
  Activity,
  Zap,
  Database,
  RefreshCw,
  Loader2,
  Lock,
  MessageSquare,
  Users
} from 'lucide-react';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, Select, Button, NavigationTabs, StatCard, Section } from '../components/ui';

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
  }, [timeRange]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.ADMIN_STATS}?range=${timeRange}`, axiosConfig);
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

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent page-enter gap-4">
         <div className="relative">
           <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping blur-sm"></div>
           <div className="relative bg-card p-4 rounded-full shadow-lg border border-primary-500/20">
              <Loader2 size={32} className="animate-spin text-primary-500" />
           </div>
         </div>
         <p className="text-[12px] text-surface-500 font-bold uppercase tracking-widest animate-pulse mt-2">Loading Server Portal</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      
      {/* Decorative Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[40%] h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent blur-[100px] rounded-bl-full"></div>
         <div className="absolute bottom-0 left-0 w-[50%] h-[300px] bg-gradient-to-t from-sky-500/5 to-transparent blur-[100px] rounded-tr-full"></div>
      </div>

      {/* Floating Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-surface-200/50 sticky top-0 z-40 transition-all">
        <div className="px-6 py-6 md:py-8 max-w-[1400px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center shadow-sm">
                  <Lock className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
               </div>
               <div>
                 <h1 className="heading-1 tracking-tight pr-4">Server Portal</h1>
                 <p className="text-sm text-surface-500 font-medium">Core system management & root analytics</p>
               </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                options={[
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Quartile' }
                ]}
                className="w-40 border-surface-300 focus:border-blue-500 focus:ring-blue-500/20 text-[13px] bg-white dark:bg-card"
              />
              <Button
                variant="glass"
                size="md"
                onClick={handleRefresh}
                loading={refreshing}
                disabled={refreshing}
                icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                className="shadow-sm"
              >
                Sync
              </Button>
            </div>
          </div>

          <div className="-mb-6 md:-mb-8 relative z-10 pt-2">
             <NavigationTabs
               tabs={[
                 { id: 'tickets', label: 'Ticket Volumes', icon: <MessageSquare className="w-4 h-4" /> },
                 { id: 'ai', label: 'Compute & AI', icon: <Zap className="w-4 h-4" /> },
                 { id: 'system', label: 'Infrastructure', icon: <Activity className="w-4 h-4" /> }
               ]}
               activeTab={selectedMetric}
               onTabChange={(tab) => setSelectedMetric(tab as any)}
             />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 px-6 py-10 overflow-y-auto w-full relative z-10">
        <div className="max-w-[1400px] mx-auto pb-12 animate-fade-in-up">
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
             <StatCard
               label="Root Users"
               value={stats?.totalUsers || 0}
               icon={<Users className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
             />
             <StatCard
               label="Active Threads"
               value={stats?.totalTickets || 0}
               icon={<MessageSquare className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
             />
             <StatCard
               label="Knowledge Clusters"
               value={stats?.totalKBs || 0}
               icon={<Database className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
             />
             <StatCard
               label="Live Socket Sessions"
               value={stats?.activeSessions || 0}
               icon={<Activity className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
             />
           </div>

           <div className="space-y-8">
             
             {/* Tickets Metric */}
             {selectedMetric === 'tickets' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                 
                 {/* Trend Timeline */}
                 <Card elevated className="lg:col-span-2 p-8 space-y-6">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><TrendingUp size={18}/></div>
                     <h3 className="heading-4">Inflow / Outflow Trends</h3>
                   </div>
                   <div className="h-[320px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={stats?.ticketTrends || []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                         <XAxis dataKey="date" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                         <YAxis stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                         <Tooltip
                           contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                           itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                         />
                         <Line type="monotone" dataKey="created" stroke="var(--chart-color-2)" name="Created" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                         <Line type="monotone" dataKey="resolved" stroke="var(--chart-color-1)" name="Resolved" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>

                 {/* Status Pie */}
                 <Card elevated className="p-8 space-y-6">
                   <div className="flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><MessageSquare size={18}/></div>
                     <h3 className="heading-4">State Distribution</h3>
                   </div>
                   <div className="h-[320px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={[
                             { name: 'Open', value: 45 },
                             { name: 'In Progress', value: 30 },
                             { name: 'Resolved', value: 20 },
                             { name: 'Closed', value: 5 }
                           ]}
                           cx="50%" cy="45%" innerRadius={70} outerRadius={110} paddingAngle={4}
                           dataKey="value" stroke="none"
                         >
                           <Cell fill="var(--chart-color-1)" />
                           <Cell fill="var(--chart-color-2)" />
                           <Cell fill="var(--chart-color-3)" />
                           <Cell fill="var(--chart-color-5)" />
                         </Pie>
                         <Tooltip
                           contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                           itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>
               </div>
             )}

             {/* AI Metrics */}
             {selectedMetric === 'ai' && (
               <div className="animate-fade-in">
                 <Card elevated className="p-8 space-y-6">
                   <div className="flex items-center justify-between border-b border-surface-200/50 pb-4">
                     <div className="flex items-center gap-3">
                       <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Zap size={18}/></div>
                       <h3 className="heading-4">Compute Confidence Thresholds</h3>
                     </div>
                     <span className="text-[11px] font-bold uppercase tracking-widest text-surface-400 bg-surface-100 px-3 py-1 rounded-full text-right">Trailing {timeRange}</span>
                   </div>
                   <div className="h-[400px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats?.confidenceAnalysis || []} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                         <XAxis dataKey="range" stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                         <YAxis stroke="var(--chart-axis)" fontSize={12} tickLine={false} axisLine={false} />
                         <Tooltip
                           contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '12px', color: 'var(--chart-tooltip-text)' }}
                           cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                           itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                         />
                         <Bar dataKey="count" fill="var(--chart-color-1)" radius={[6, 6, 0, 0]} barSize={50} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </Card>
               </div>
             )}

             {/* System Health */}
             {selectedMetric === 'system' && (
               <div className="animate-fade-in">
                 <Section title="Node Infrastructure" subtitle="Real-time subsystem linkage states">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                     
                     <Card elevated className="p-6 space-y-4 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent relative group overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                       <div className="flex items-center gap-2 relative z-10">
                         <Database className="w-5 h-5 text-emerald-500" />
                         <span className="text-[11px] font-bold uppercase tracking-widest text-surface-500">PostgreSQL</span>
                       </div>
                       <p className="text-2xl font-black tracking-tight text-emerald-600 relative z-10">Healthy</p>
                     </Card>

                     <Card elevated className="p-6 space-y-4 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent relative group overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                       <div className="flex items-center gap-2 relative z-10">
                         <Activity className="w-5 h-5 text-amber-500" />
                         <span className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Redis Memory</span>
                       </div>
                       <p className="text-2xl font-black tracking-tight text-amber-600 relative z-10">Connected</p>
                     </Card>

                     <Card elevated className="p-6 space-y-4 border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent relative group overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                       <div className="flex items-center gap-2 relative z-10">
                         <MessageSquare className="w-5 h-5 text-blue-500" />
                         <span className="text-[11px] font-bold uppercase tracking-widest text-surface-500">Socket.IO Tunnels</span>
                       </div>
                       <p className="text-2xl font-black tracking-tight text-blue-600 relative z-10">Active</p>
                     </Card>

                     <Card elevated className="p-6 space-y-4 border-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-transparent relative group overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                       <div className="flex items-center gap-2 relative z-10">
                         <Zap className="w-5 h-5 text-indigo-500" />
                         <span className="text-[11px] font-bold uppercase tracking-widest text-surface-500">API Latency Avg</span>
                       </div>
                       <p className="text-2xl font-black tracking-tight text-indigo-600 relative z-10">142ms</p>
                     </Card>

                     <Card elevated className="p-6 space-y-4 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent relative group overflow-hidden">
                       <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                       <div className="flex items-center gap-2 relative z-10">
                         <TrendingUp className="w-5 h-5 text-emerald-500" />
                         <span className="text-[11px] font-bold uppercase tracking-widest text-surface-500">System Uptime</span>
                       </div>
                       <p className="text-2xl font-black tracking-tight text-emerald-600 relative z-10">99.8%</p>
                     </Card>
                     
                   </div>
                 </Section>
               </div>
             )}

           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
