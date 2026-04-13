import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Loader2,
  Users,
  Clock,
  Activity,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Bed,
  BarChart2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Simulated weekly discharge trend for chart
const weeklyData = [
  { day: 'Mon', discharged: 3, target: 5 },
  { day: 'Tue', discharged: 5, target: 5 },
  { day: 'Wed', discharged: 4, target: 5 },
  { day: 'Thu', discharged: 7, target: 5 },
  { day: 'Fri', discharged: 6, target: 5 },
  { day: 'Sat', discharged: 2, target: 5 },
  { day: 'Sun', discharged: 1, target: 5 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-zinc-300 font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [tasksByRole, setTasksByRole] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashRes, tasksRes] = await Promise.all([
          axios.get(`${API}/analytics/dashboard`, { withCredentials: true }),
          axios.get(`${API}/analytics/tasks-by-role`, { withCredentials: true })
        ]);
        setAnalytics(dashRes.data);
        setTasksByRole(tasksRes.data);
      } catch (error) {
        console.error('Fetch analytics error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const roleBarData = Object.entries(tasksByRole).map(([role, count]) => ({ role, count }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Analytics Dashboard
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Overview of discharge operations and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Patients</p>
              <p className="text-3xl font-semibold text-zinc-50 mt-1">
                {analytics?.patients?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-amber-400">
              <Bed className="w-3 h-3" />
              {analytics?.patients?.admitted || 0} admitted
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Active Workflows</p>
              <p className="text-3xl font-semibold text-zinc-50 mt-1">
                {analytics?.workflows?.active || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <AlertCircle className="w-3 h-3" />
              {analytics?.workflows?.pending_approval || 0} pending approval
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Discharged Today</p>
              <p className="text-3xl font-semibold text-zinc-50 mt-1">
                {analytics?.workflows?.completed_today || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              {analytics?.patients?.discharged || 0} total discharged
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Avg Discharge Time</p>
              <p className="text-3xl font-semibold text-zinc-50 mt-1">
                {analytics?.metrics?.avg_discharge_time_hours || '--'}
                <span className="text-lg text-zinc-500 ml-1">hrs</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="text-zinc-500">Target: &lt;2 hrs</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Discharge Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <h2 className="text-base font-medium text-zinc-50">Weekly Discharges</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-5">Daily discharge count vs target</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="discharged" name="Discharged" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                {weeklyData.map((entry, index) => (
                  <Cell key={index} fill={entry.discharged >= entry.target ? '#10b981' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-base font-medium text-zinc-50 mb-5">Patient Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Admitted</span>
                <span className="text-sm text-zinc-200">{analytics?.patients?.admitted || 0}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-700"
                  style={{ 
                    width: `${((analytics?.patients?.admitted || 0) / (analytics?.patients?.total || 1)) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Pending Discharge</span>
                <span className="text-sm text-zinc-200">{analytics?.patients?.pending_discharge || 0}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-700"
                  style={{ 
                    width: `${((analytics?.patients?.pending_discharge || 0) / (analytics?.patients?.total || 1)) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Discharged</span>
                <span className="text-sm text-zinc-200">{analytics?.patients?.discharged || 0}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ 
                    width: `${((analytics?.patients?.discharged || 0) / (analytics?.patients?.total || 1)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks by Role + Task Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Role Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-base font-medium text-zinc-50 mb-5">Pending Tasks by Role</h2>
          {roleBarData.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No pending tasks</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={roleBarData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="role" tick={{ fill: '#a1a1aa', fontSize: 11, textTransform: 'capitalize' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tasks" radius={[0, 3, 3, 0]}>
                  {roleBarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.role === 'physician' ? '#3b82f6' : entry.role === 'nurse' ? '#10b981' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-base font-medium text-zinc-50 mb-5">Task Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pending Tasks</p>
              <p className="text-2xl font-semibold text-amber-400">{analytics?.tasks?.pending || 0}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">In Progress</p>
              <p className="text-2xl font-semibold text-blue-400">{analytics?.tasks?.in_progress || 0}</p>
            </div>
          </div>
          {/* Efficiency indicator */}
          <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Discharge Efficiency Score</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-emerald-400">
                {analytics?.metrics?.avg_discharge_time_hours
                  ? Math.max(0, Math.round(100 - (analytics.metrics.avg_discharge_time_hours / 8) * 100))
                  : 75}%
              </span>
              <span className="text-xs text-zinc-500 mb-1">vs 8h manual baseline</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${analytics?.metrics?.avg_discharge_time_hours
                    ? Math.max(0, Math.round(100 - (analytics.metrics.avg_discharge_time_hours / 8) * 100))
                    : 75}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
