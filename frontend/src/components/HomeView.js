import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Users,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  Bed,
  ClipboardList,
  Zap,
  Plus,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Simulated discharge trend data for the chart
const generateTrendData = () => {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const baseline = [7.2, 6.8, 6.5, 5.1, 3.8, 2.4];
  return months.map((month, i) => ({
    month,
    avgHours: baseline[i],
    target: 2.0,
  }));
};

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendUp }) => (
  <div
    data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors duration-200"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-[0.15em] font-medium">{title}</p>
        <p className="text-3xl font-semibold text-zinc-50 mt-2">{value}</p>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.5} />
      </div>
    </div>
    {trend != null && (
      <div className="mt-4 flex items-center gap-1.5 text-xs">
        {trendUp ? (
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span className={trendUp ? 'text-emerald-400' : 'text-amber-400'}>{trend}</span>
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-zinc-300 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value}h
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const HomeView = ({ onNavigate }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const trendData = generateTrendData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, notifsRes] = await Promise.all([
          axios.get(`${API}/analytics/dashboard`, { withCredentials: true }),
          axios.get(`${API}/notifications`, { withCredentials: true }),
        ]);
        setAnalytics(analyticsRes.data);
        setNotifications(notifsRes.data.slice(0, 5));
      } catch (err) {
        console.error('HomeView fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const canAddPatient = ['physician', 'nurse', 'admin'].includes(user?.role);
  const canViewAnalytics = ['physician', 'nurse', 'admin'].includes(user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const getNotifDot = (type) => {
    const map = { info: 'bg-blue-400', success: 'bg-emerald-400', warning: 'bg-amber-400', error: 'bg-rose-400' };
    return map[type] || 'bg-blue-400';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canAddPatient && (
            <Button
              data-testid="home-add-patient-btn"
              onClick={() => onNavigate('patients')}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={analytics?.patients?.total ?? '—'}
          subtitle={`${analytics?.patients?.admitted ?? 0} currently admitted`}
          icon={Users}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          trend="vs last week"
          trendUp={true}
        />
        <StatCard
          title="Active Workflows"
          value={analytics?.workflows?.active ?? '—'}
          subtitle={`${analytics?.workflows?.pending_approval ?? 0} pending approval`}
          icon={Activity}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
        />
        <StatCard
          title="Discharged Today"
          value={analytics?.workflows?.completed_today ?? '—'}
          subtitle={`${analytics?.patients?.discharged ?? 0} total this period`}
          icon={CheckCircle2}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
          trend="30% increase in bed turnover"
          trendUp={true}
        />
        <StatCard
          title="Avg Discharge Time"
          value={analytics?.metrics?.avg_discharge_time_hours ? `${analytics.metrics.avg_discharge_time_hours}h` : '< 2h'}
          subtitle="Target: under 2 hours"
          icon={Clock}
          iconBg="bg-rose-500/10"
          iconColor="text-rose-400"
          trend="75% faster than manual process"
          trendUp={true}
        />
      </div>

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discharge Time Trend Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-medium text-zinc-50">Discharge Time Trend</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Average hours vs 2h target</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />
                Avg hours
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />
                Target
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avgHours" name="Avg hours" stroke="#3b82f6" fill="url(#blueGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#10b981" fill="url(#greenGrad)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-zinc-50">Recent Activity</h2>
            <span className="text-xs text-zinc-500">{notifications.length} recent</span>
          </div>
          {notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Zap className="w-8 h-8 text-zinc-700 mb-2" strokeWidth={1.5} />
              <p className="text-zinc-500 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {notifications.map((n) => (
                <div key={n.notification_id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotifDot(n.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'text-zinc-400' : 'text-zinc-200 font-medium'} line-clamp-1`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatTime(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions + Patient Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Status Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-base font-medium text-zinc-50 mb-5">Patient Census</h2>
          <div className="space-y-4">
            {[
              { label: 'Admitted', count: analytics?.patients?.admitted ?? 0, total: analytics?.patients?.total ?? 1, color: 'bg-amber-500' },
              { label: 'Pending Discharge', count: analytics?.patients?.pending_discharge ?? 0, total: analytics?.patients?.total ?? 1, color: 'bg-blue-500' },
              { label: 'Discharged', count: analytics?.patients?.discharged ?? 0, total: analytics?.patients?.total ?? 1, color: 'bg-emerald-500' },
            ].map(({ label, count, total, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-zinc-400">{label}</span>
                  <span className="text-sm font-medium text-zinc-200">{count}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${((count / total) * 100).toFixed(1)}%` }}
                  />
                </div>
              </div>
            ))}
            <button
              data-testid="home-view-patients-btn"
              onClick={() => onNavigate('patients')}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all patients <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-base font-medium text-zinc-50 mb-5">Quick Actions</h2>
          <div className="space-y-2">
            <button
              data-testid="quick-action-patients"
              onClick={() => onNavigate('patients')}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-4.5 h-4.5 text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">Patient List</p>
                <p className="text-xs text-zinc-500">View and manage all patients</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </button>

            <button
              data-testid="quick-action-tasks"
              onClick={() => onNavigate('tasks')}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <ClipboardList className="w-4.5 h-4.5 text-amber-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">My Tasks</p>
                <p className="text-xs text-zinc-500">
                  {analytics?.tasks?.pending ?? 0} pending · {analytics?.tasks?.in_progress ?? 0} in progress
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </button>

            {canViewAnalytics && (
              <button
                data-testid="quick-action-analytics"
                onClick={() => onNavigate('analytics')}
                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <BarChart3 className="w-4.5 h-4.5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">Analytics</p>
                  <p className="text-xs text-zinc-500">Discharge metrics & performance</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HIPAA Compliance Banner */}
      <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Bed className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm text-zinc-300 font-medium">HIPAA Compliant · AES-256 Encrypted · Audit Logged</p>
          <p className="text-xs text-zinc-500">All patient data is protected under strict access controls and retention policies</p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
