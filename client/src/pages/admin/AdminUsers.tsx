import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Ban, CheckCircle2, ArrowLeft, Sparkles, Filter, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { IUser } from '../../types';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Credit Adjustment Modal
  const [adjustingUser, setAdjustingUser] = useState<IUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('Platform promotional incentive');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: IUser) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to change ${user.name}'s status to ${newStatus}?`)) return;

    try {
      const res = await api.put(`/admin/users/${user._id || user.id}/status`, { status: newStatus });
      if (res.data.success) {
        setActionMsg(`User status updated to ${newStatus}.`);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;

    try {
      setIsAdjusting(true);
      const res = await api.post('/admin/adjust-credits', {
        userId: adjustingUser._id || adjustingUser.id,
        amount: Number(adjustAmount),
        reason: adjustReason,
      });

      if (res.data.success) {
        setActionMsg(`Adjusted credits for ${adjustingUser.name}: ${res.data.message}`);
        setAdjustingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust credits.');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Admin Overview
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">User & Role Management</h1>
          <p className="text-xs text-slate-500 mt-1">Audit platform accounts, toggle account suspensions, and issue auditable credit adjustments.</p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-500 hover:text-emerald-700">âœ•</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="relative flex-1 w-full"
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="learner">Learners</option>
            <option value="provider">Providers</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Roles</th>
                <th className="py-3 px-5">Credit Balance</th>
                <th className="py-3 px-5">Account Status</th>
                <th className="py-3 px-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading user accounts...</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-indigo-600">{u.creditBalance} Credits</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setAdjustingUser(u)}
                        className="px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold"
                      >
                        Adjust Credits
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          u.status === 'active'
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Adjustment Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="retro-card bg-stone-900 border-2 border-black max-w-md w-full p-6 space-y-4 text-stone-100">
            <h3 className="text-xs font-bold font-retro text-amber-400 uppercase">
              [OVERRIDE COIN LEDGER: {adjustingUser.name}]
            </h3>
            <p className="text-xs text-stone-400 font-mono">
              Current balance: <strong className="text-amber-400 font-retro text-[10px]">{adjustingUser.creditBalance} COINS</strong>. Every adjustment is recorded in the permanent transaction audit ledger.
            </p>

            <form onSubmit={handleAdjustCredits} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1 font-retro text-[10px]">
                  COIN DELTA (+ OR -)
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1 font-retro text-[10px]">
                  AUDIT LOG REASON
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation for platform maintenance or promotional grant"
                  className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none resize-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="px-4 py-2 border-2 border-stone-700 bg-stone-800 text-stone-300 text-xs font-bold font-retro text-[10px] hover:bg-stone-700 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-4 py-2 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs font-retro text-[10px] uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  {isAdjusting ? 'PROCESSING...' : 'APPLY ADJUSTMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};