import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  Plus 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-purple-200">
            <Shield size={13} className="text-purple-400" />
            <span>Platform Governance & System Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Control Center
          </h1>
          <p className="text-xs text-purple-200 max-w-xl">
            Monitor credit circulation, verify skill providers, oversee user integrity, and inspect auditable transaction records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-xs hover:bg-purple-50 shadow transition-colors flex items-center gap-1.5"
          >
            <Users size={14} />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/verifications"
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>Verifications ({stats?.pendingVerifications || 0})</span>
          </Link>
          <Link
            to="/admin/ledger"
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>Audit Ledger</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Primary Platform Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Credits in Circulation</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-indigo-600">{stats?.creditsInCirculation || 0}</span>
            <Sparkles size={18} className="text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400">Total liquid user balances</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Registered Users</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats?.totalUsers || 0}</span>
            <Users size={18} className="text-indigo-500" />
          </div>
          <p className="text-[11px] text-slate-400">{stats?.totalProviders || 0} registered providers</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Completed Sessions</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-600">{stats?.completedSessions || 0}</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-400">{stats?.totalBookings || 0} total bookings created</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Teaching Credits Rewarded</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-purple-600">+{stats?.totalCreditsEarned || 0}</span>
            <TrendingUp size={18} className="text-purple-400" />
          </div>
          <p className="text-[11px] text-slate-400">Awarded to completing instructors</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Booking Velocity Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Booking Growth & Completion Velocity</h3>
            <p className="text-xs text-slate-500">Monthly completed sessions and skill credit flow</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.bookingsTrend || []}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" name="Bookings" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Category Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Offerings by Category</h3>
            <p className="text-xs text-slate-500">Distribution of published skills across learning topics</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.categoryBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} name="Skill Listings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Skills Leaderboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Most Popular Skill Offerings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Skill Title</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4 text-center">Credit Cost</th>
                <th className="py-3 px-4 text-center">Rating</th>
                <th className="py-3 px-4 text-right">Total Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(analytics?.topSkills || []).map((skill: any) => (
                <tr key={skill._id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{skill.title}</td>
                  <td className="py-3 px-4 text-slate-600">{skill.provider?.name || 'Verified Provider'}</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-600">{skill.creditCost} Credits</td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-500">â˜… {skill.rating.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">{skill.totalBookings} taught</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};