import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowUpRight, ArrowDownLeft, Shield, Filter } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ICreditTransaction } from '../../types';
import { CreditBadge } from '../../components/CreditBadge';

export const LearnerCredits: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<ICreditTransaction[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [selectedType]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 50 };
      if (selectedType !== 'all') params.type = selectedType;

      const res = await api.get('/credits/history', { params });
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    initial_grant: { label: 'Welcome Grant', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    session_redemption: { label: 'Session Booking', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    session_refund: { label: 'Session Refund', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    teaching_reward: { label: 'Teaching Reward', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    admin_adjustment: { label: 'Admin Adjustment', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-stone-950 text-stone-100">
      <Link to="/learner/dashboard" className="retro-btn inline-flex items-center gap-1.5 font-pixel text-[9px] px-3 py-1.5 bg-stone-800 text-stone-300 hover:text-white">
        <ArrowLeft size={12} /> [BACK TO DASHBOARD]
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-pixel text-amber-300">ARCADE COIN LEDGER</h1>
          <p className="font-retro-mono text-xs text-stone-400 mt-1">Immutable, auditable token history for your player account.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-pixel text-[9px] text-stone-400">PLAYER VAULT:</span>
          <CreditBadge amount={user?.creditBalance ?? 0} size="lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1">
          <span className="font-pixel text-[8px] text-stone-400">ACTIVE COIN BALANCE</span>
          <p className="font-pixel text-xl text-amber-400">🪙 {user?.creditBalance} COINS</p>
          <p className="font-retro-mono text-[10px] text-stone-400">Validated server ledger</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1">
          <span className="font-pixel text-[8px] text-stone-400">LIFETIME BOUNTIES</span>
          <p className="font-pixel text-xl text-emerald-400">+{user?.creditsEarned || 0} COINS</p>
          <p className="font-retro-mono text-[10px] text-stone-400">Earned teaching quests</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1">
          <span className="font-pixel text-[8px] text-stone-400">STAKED REDEMPTIONS</span>
          <p className="font-pixel text-xl text-stone-300">-{user?.creditsSpent || 0} COINS</p>
          <p className="font-retro-mono text-[10px] text-stone-400">Redeemed for mentor matches</p>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="retro-card bg-stone-900 border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 border-b-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-950">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[9px] text-amber-300">[TRANSACTION VAULT LOG]</span>
            <span className="font-retro-mono text-xs text-stone-400">({transactions.length} entries)</span>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-amber-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="retro-chip font-retro-mono text-xs border border-black bg-stone-900 px-3 py-1.5 text-stone-200 focus:outline-none focus:border-amber-400"
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

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-retro-mono text-xs">
            <thead className="bg-stone-950 border-b-2 border-black text-amber-300 font-pixel text-[8px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">TX ID</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">DESCRIPTION</th>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4 text-right">AMOUNT</th>
                <th className="py-3 px-4 text-right">VAULT BALANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-pixel text-[9px] text-stone-500">READING LEDGER RECORDS...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-pixel text-[9px] text-stone-500">NO TRANSACTIONS RECORDED FOR THIS FILTER.</td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx._id} className="hover:bg-stone-800/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-400 text-[11px]">{tx.transactionId}</td>
                      <td className="py-3 px-4">
                        <span className="retro-chip font-pixel text-[7px] px-1.5 py-0.5 border border-black bg-stone-950 text-stone-300">
                          {tx.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-200 max-w-xs truncate">{tx.description}</td>
                      <td className="py-3 px-4 text-stone-400 text-[11px] whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className={`py-3 px-4 text-right font-pixel text-[10px] whitespace-nowrap ${
                        isPositive ? 'text-emerald-400' : 'text-stone-300'
                      }`}>
                        {isPositive ? `+${tx.amount}` : tx.amount} 🪙
                      </td>
                      <td className="py-3 px-4 text-right font-pixel text-[10px] text-amber-300 whitespace-nowrap">
                        {tx.balanceAfter} 🪙
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