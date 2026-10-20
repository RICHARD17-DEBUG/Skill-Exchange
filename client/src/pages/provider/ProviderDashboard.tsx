import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Presentation, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Star, 
  Video, 
  Plus, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IBooking } from '../../types';
import { getMeetingUrl } from '../../lib/utils';

export const ProviderDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [pendingBookings, setPendingBookings] = useState<IBooking[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [pendingRes, confirmedRes] = await Promise.all([
        api.get('/bookings?role=provider&status=pending'),
        api.get('/bookings?role=provider&status=confirmed')
      ]);

      if (pendingRes.data.success) setPendingBookings(pendingRes.data.bookings);
      if (confirmedRes.data.success) setUpcomingSessions(confirmedRes.data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await api.put(`/bookings/${id}/accept`);
      if (res.data.success) {
        setActionMsg(`Booking confirmed! ${res.data.booking.creditCost} credits securely deducted from learner.`);
        await refreshUser();
        loadDashboard();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept booking.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for declining request:');
    try {
      const res = await api.put(`/bookings/${id}/reject`, { reason });
      if (res.data.success) {
        setActionMsg('Booking request rejected.');
        loadDashboard();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject booking.');
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Mark this teaching session as completed? Eligible teaching credits will be immediately awarded to your balance.')) {
      return;
    }

    try {
      const res = await api.put(`/bookings/${id}/complete`);
      if (res.data.success) {
        setActionMsg(`Session completed! You earned ${res.data.booking.creditCost} skill credits.`);
        await refreshUser();
        loadDashboard();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete session.');
    }
  };

  const isVerified = user?.providerProfile?.isVerified;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-stone-950 text-stone-100">
      {/* 1. Provider Banner */}
      <div className="retro-card bg-stone-900 border-2 border-black p-6 sm:p-8 text-stone-100 shadow-[4px_4px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle CRT Scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)] z-0" />

        <div className="space-y-3 z-10">
          <div className="flex items-center gap-2">
            <span className="retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-800 text-emerald-400 border border-black px-2.5 py-1 shadow-sm">
              <Presentation size={12} className="inline mr-1" />
              <span>PLAYER 2: MENTOR GUILD</span>
            </span>
            {isVerified ? (
              <span className="retro-chip font-pixel text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-2 py-0.5">
                <ShieldCheck size={11} className="inline mr-0.5" /> VERIFIED MENTOR
              </span>
            ) : (
              <span className="retro-chip font-pixel text-[8px] bg-amber-950 text-amber-300 border border-amber-600 px-2 py-0.5">
                PROVISIONAL
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-pixel text-amber-300 tracking-wide leading-tight">
            INSTRUCTOR CONSOLE // {user?.name.toUpperCase()}
          </h1>
          <p className="font-retro-mono text-xs text-stone-300 max-w-xl leading-relaxed">
            Manage your challenge slots, accept student match requests, and earn coin bounties upon session victory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link
            to="/provider/listings"
            className="retro-btn font-pixel text-[9px] px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>[SKILL LISTINGS]</span>
          </Link>
          <Link
            to="/provider/availability"
            className="retro-btn font-pixel text-[9px] px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border-black flex items-center gap-1.5"
          >
            <Calendar size={13} />
            <span>[SET SCHEDULE]</span>
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 border-2 border-black bg-emerald-950 text-emerald-200 font-retro-mono text-xs flex items-center justify-between shadow-[2px_2px_0px_#000]">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-400 hover:text-white">
            <XCircle size={15} />
          </button>
        </div>
      )}

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">TOTAL BOUNTIES</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-emerald-400">+{user?.creditsEarned || 0}</span>
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">Teaching rewards earned</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">PENDING REQUESTS</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-amber-400">{pendingBookings.length}</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">Awaiting your confirm</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">QUEUED MATCHES</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-stone-100">{upcomingSessions.length}</span>
            <Calendar size={16} className="text-stone-300" />
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">Locked in calendar</p>
        </div>

        <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[3px_3px_0px_#000] space-y-1.5">
          <span className="font-pixel text-[8px] text-stone-400">MENTOR RANK</span>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-pixel text-xl text-amber-400 flex items-center gap-1">
              <Star size={16} className="fill-amber-400" />
              {user?.providerProfile?.rating?.toFixed(1) || '5.0'}
            </span>
            <span className="font-retro-mono text-xs text-stone-400">({user?.providerProfile?.reviewCount || 0})</span>
          </div>
          <p className="font-retro-mono text-[10px] text-stone-400">From challenger reviews</p>
        </div>
      </div>

      {/* 3. Pending Requests Section */}
      <div className="retro-card bg-stone-900 border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h2 className="font-pixel text-xs text-amber-300">
            [PENDING BOOKING CHALLENGES ({pendingBookings.length})]
          </h2>
          <span className="font-retro-mono text-[10px] text-stone-400">Coins held in escrow upon acceptance</span>
        </div>

        {pendingBookings.length === 0 ? (
          <p className="font-pixel text-[9px] text-stone-500 py-6 text-center">NO PENDING CHALLENGES RIGHT NOW.</p>
        ) : (
          <div className="space-y-3">
            {pendingBookings.map((b) => (
              <div
                key={b._id}
                className="retro-card bg-stone-950 border-2 border-black p-4 shadow-[2px_2px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-stone-100">{b.skillListing?.title}</span>
                    <span className="retro-chip font-pixel text-[8px] bg-amber-400 text-black px-1.5 py-0.5">
                      PENDING
                    </span>
                  </div>
                  <p className="font-retro-mono text-xs text-stone-300">
                    Learner: <span className="font-bold text-amber-300">{b.learner?.name}</span> ({b.learner?.email})
                  </p>
                  <div className="flex items-center gap-3 font-retro-mono text-xs text-stone-400 pt-0.5">
                    <span className="font-bold text-stone-200">{b.date} at {b.startTime}</span>
                    <span className="text-amber-400 font-pixel text-[9px]">🪙 BOUNTY: +{b.creditCost} COINS</span>
                  </div>
                  {b.learnerNotes && (
                    <p className="font-retro-mono text-xs text-stone-400 italic bg-stone-900 p-2 border border-black mt-1">
                      "{b.learnerNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleAccept(b._id)}
                    className="retro-btn font-pixel text-[9px] px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex-1 md:flex-initial"
                  >
                    ACCEPT & LOCK
                  </button>
                  <button
                    onClick={() => handleReject(b._id)}
                    className="retro-btn font-pixel text-[9px] px-3 py-2 bg-stone-800 text-red-400 hover:bg-stone-700 flex-1 md:flex-initial"
                  >
                    DECLINE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Upcoming Confirmed Sessions */}
      <div className="retro-card bg-stone-900 border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h2 className="font-pixel text-xs text-amber-300">
            [UPCOMING TEACHING SESSIONS ({upcomingSessions.length})]
          </h2>
          <Link to="/provider/sessions" className="font-pixel text-[9px] text-stone-400 hover:text-amber-400">
            ALL SESSIONS →
          </Link>
        </div>

        {upcomingSessions.length === 0 ? (
          <p className="font-pixel text-[9px] text-stone-500 py-6 text-center">NO UPCOMING TEACHING SESSIONS QUEUED.</p>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((b) => (
              <div
                key={b._id}
                className="retro-card bg-stone-950 border-2 border-black p-4 shadow-[2px_2px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="retro-chip font-pixel text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 uppercase">
                      CONFIRMED
                    </span>
                    <span className="font-retro-mono text-xs text-stone-500">REF: {b.bookingReference}</span>
                  </div>
                  <h3 className="font-pixel text-xs text-stone-100">{b.skillListing?.title}</h3>
                  <p className="font-retro-mono text-xs text-stone-300">Student: {b.learner?.name}</p>
                  <div className="flex items-center gap-3 font-retro-mono text-xs text-stone-400 pt-0.5">
                    <span className="text-stone-200">{b.date} at {b.startTime} - {b.endTime}</span>
                    <span className="font-pixel text-[9px] text-amber-400">REWARD: +{b.creditCost} COINS</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Link
                    to={getMeetingUrl(b)}
                    className="retro-btn font-pixel text-[9px] px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 flex items-center gap-1.5"
                  >
                    <Video size={13} />
                    <span>ENTER ROOM</span>
                  </Link>

                  <button
                    onClick={() => handleComplete(b._id)}
                    className="retro-btn font-pixel text-[9px] px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>CLAIM BOUNTY</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};