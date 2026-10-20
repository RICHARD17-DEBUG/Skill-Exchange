import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Video, 
  ArrowUpRight, 
  ArrowRight, 
  TrendingUp, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IBooking, ICreditTransaction, ISkillListing } from '../../types';
import { CreditBadge } from '../../components/CreditBadge';
import { SkillCard } from '../../components/SkillCard';
import { getMeetingUrl } from '../../lib/utils';

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<IBooking[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<ICreditTransaction[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<ISkillListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [bookingsRes, creditsRes, skillsRes] = await Promise.all([
        api.get('/bookings?role=learner&status=confirmed'),
        api.get('/credits/summary'),
        api.get('/skills?limit=3&sort=popular')
      ]);

      if (bookingsRes.data.success) setUpcomingBookings(bookingsRes.data.bookings);
      if (creditsRes.data.success) setRecentTransactions(creditsRes.data.summary.recentTransactions);
      if (skillsRes.data.success) setRecommendedSkills(skillsRes.data.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-stone-950 text-stone-100">
      {/* 1. Welcome Banner: Retro Arcade Casing */}
      <div className="retro-card bg-stone-900 border-2 border-black p-6 sm:p-8 text-stone-100 shadow-[4px_4px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle CRT Scanline overlay effect */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)] z-0" />

        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-800 text-amber-300 border border-black shadow-[1px_1px_0px_#000]">
            <span>🕹️</span>
            <span>PLAYER 1: LEARNER WORKSPACE</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-pixel text-amber-300 tracking-wide leading-tight">
            WELCOME BACK, {user?.name.split(' ')[0].toUpperCase()}!
          </h1>
          <p className="font-retro-mono text-xs text-stone-300 max-w-xl leading-relaxed">
            COIN INVENTORY: <span className="font-pixel text-[11px] text-amber-400">🪙 {user?.creditBalance} COINS</span>. Stake coins on 1-on-1 mentor matches or earn bounties by teaching.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            to="/explore"
            className="retro-btn font-pixel text-[9px] px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1.5"
          >
            <BookOpen size={13} />
            <span>[FIND QUESTS]</span>
          </Link>
          <Link
            to="/learner/credits"
            className="retro-btn font-pixel text-[9px] px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border-black flex items-center gap-1.5"
          >
            <span>[COIN LEDGER]</span>
          </Link>
        </div>
      </div>

      {/* 2. Metric Cards Row: Chunky Retro Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">COIN BALANCE</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-amber-400">🪙 {user?.creditBalance}</span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">Escrow-backed balance</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">ACTIVE MATCHES</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-stone-100">{upcomingBookings.length}</span>
            <Calendar size={16} className="text-amber-400" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">Confirmed & queued</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">COINS STAKED</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-stone-300">{user?.creditsSpent || 0}</span>
            <TrendingUp size={16} className="text-stone-400" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">Invested in skills</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">BOUNTIES EARNED</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-emerald-400">+{user?.creditsEarned || 0}</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">From peer mentoring</p>
        </div>
      </div>

      {/* 3. Two Columns: Upcoming Matches & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h2 className="font-pixel text-xs text-amber-300">[UPCOMING CONFIRMED MATCHES]</h2>
            <Link to="/learner/sessions" className="font-pixel text-[9px] text-stone-400 hover:text-amber-400">
              VIEW ALL →
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="retro-card bg-stone-900 border-2 border-black p-8 text-center space-y-3 shadow-[3px_3px_0px_#000]">
              <Calendar size={28} className="mx-auto text-stone-500" />
              <h3 className="font-pixel text-xs text-stone-300">NO ACTIVE MATCHES SCHEDULED</h3>
              <p className="font-retro-mono text-xs text-stone-400 max-w-sm mx-auto">
                Explore the skill board and challenge a mentor to a 1-on-1 session.
              </p>
              <Link
                to="/explore"
                className="inline-block retro-btn font-pixel text-[9px] px-4 py-2 bg-amber-400 text-black font-bold"
              >
                [BROWSE SKILLS]
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <div
                  key={b._id}
                  className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <span className="retro-chip font-pixel text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 uppercase">
                      STATUS: {b.status}
                    </span>
                    <h3 className="font-pixel text-xs text-stone-100">{b.skillListing?.title}</h3>
                    <p className="font-retro-mono text-xs text-stone-400">Mentor: {b.provider?.name}</p>
                    <div className="flex items-center gap-3 font-retro-mono text-xs text-stone-400 pt-1">
                      <span className="flex items-center gap-1 font-bold text-amber-300">
                        <Calendar size={12} /> {b.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {b.startTime} - {b.endTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      to={getMeetingUrl(b)}
                      className="retro-btn font-pixel text-[9px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <Video size={13} />
                      <span>ENTER ROOM</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (1 col): Recent Credit Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h2 className="font-pixel text-xs text-amber-300">[RECENT COIN LOG]</h2>
            <Link to="/learner/credits" className="font-pixel text-[9px] text-stone-400 hover:text-amber-400">
              LEDGER →
            </Link>
          </div>

          <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] divide-y-2 divide-black">
            {recentTransactions.length === 0 ? (
              <p className="font-pixel text-[9px] text-stone-500 py-4 text-center">NO TRANSACTIONS LOGGED.</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-retro-mono text-xs text-stone-200 truncate">{tx.description}</p>
                    <p className="font-retro-mono text-[9px] text-stone-500 mt-0.5 truncate">{tx.transactionId}</p>
                  </div>
                  <span
                    className={`font-pixel text-[10px] shrink-0 ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-stone-300'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🪙
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Recommended Skills */}
      <div className="space-y-3 pt-2">
        <h2 className="font-pixel text-xs text-amber-300">[RECOMMENDED SKILL QUESTS]</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendedSkills.map((s) => (
            <SkillCard key={s._id} listing={s} />
          ))}
        </div>
      </div>
    </div>
  );
};