import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Filter, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { ICreditTransaction } from '../../types';

export const AdminLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<ICreditTransaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLedger();
  }, [typeFilter]);

  const fetchAuditLedger = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 50 };
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await api.get('/admin/ledger', { params });
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Platform Credit Audit Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">System-wide immutable ledger capturing all skill credit grants, redemptions, rewards, and refunds.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-medium"
          >
            <option value="all">All Transaction Types</option>
            <option value="initial_grant">Welcome Bonus Grants</option>
            <option value="session_redemption">Session Redemptions</option>
            <option value="session_refund">Session Refunds</option>
            <option value="teaching_reward">Teaching Rewards</option>
            <option value="admin_adjustment">Admin Adjustments</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">TX ID</th>
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5 text-right">Amount</th>
                <th className="py-3 px-5 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading ledger records...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No transactions recorded for this filter.</td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const userName = typeof tx.user === 'object' ? (tx.user as any).name : 'User';
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-mono text-[11px] font-semibold text-slate-600">
                        {tx.transactionId}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-800">
                        {userName}
                      </td>
                      <td className="py-3.5 px-5 capitalize font-medium text-slate-600">
                        {tx.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`py-3.5 px-5 text-right font-bold ${
                        tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Credits
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                        {tx.balanceAfter} Credits
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};