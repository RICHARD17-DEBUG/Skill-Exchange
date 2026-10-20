import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { IBooking } from '../../types';
import { getMeetingUrl } from '../../lib/utils';

export const ProviderSessions: React.FC = () => {
  const { refreshUser } = useAuth();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const params: any = { role: 'provider' };
      if (activeTab !== 'all') params.status = activeTab;

      const res = await api.get('/bookings', { params });
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Mark session completed? Teaching credits will be immediately added to your ledger.')) return;
    try {
      const res = await api.put(`/bookings/${id}/complete`);
      if (res.data.success) {
        setActionMsg(`Session marked completed. ${res.data.booking.creditCost} credits awarded!`);
        await refreshUser();
        fetchSessions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete session.');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await api.put(`/bookings/${id}/accept`);
      if (res.data.success) {
        setActionMsg('Booking accepted and learner credits reserved.');
        await refreshUser();
        fetchSessions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept booking.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for declining:');
    try {
      const res = await api.put(`/bookings/${id}/reject`, { reason });
      if (res.data.success) {
        setActionMsg('Booking declined.');
        fetchSessions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject.');
    }
  };

  const statusColorMap: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    confirmed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link to="/provider/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Teaching Sessions & Requests</h1>
        <p className="text-xs text-slate-500 mt-1">Review student applications, start live video meetings, and complete sessions.</p>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-500 hover:text-emerald-700">âœ•</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl transition-all capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="retro-card bg-stone-900 border-2 border-black p-12 text-center space-y-2 text-stone-100">
          <Calendar size={36} className="mx-auto text-stone-600" />
          <h3 className="text-sm font-bold font-retro text-amber-400">NO {activeTab !== 'all' ? activeTab.toUpperCase() : ''} SESSIONS FOUND</h3>
          <p className="text-xs text-stone-400 font-mono">Student requests will appear here when learners book your quests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="retro-card bg-stone-900 border-2 border-black p-6 text-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 border-2 text-[9px] font-bold font-retro uppercase ${statusColorMap[booking.status]}`}>
                    {booking.status}
                  </span>
                  <span className="font-mono text-xs text-stone-400">REF: {booking.bookingReference}</span>
                </div>

                <h3 className="text-sm font-bold font-retro text-stone-100 truncate">{booking.skillListing?.title}</h3>
                <p className="text-xs text-stone-300 font-mono">
                  Player: <strong className="text-amber-400">{booking.learner?.name}</strong> ({booking.learner?.email})
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-1 font-mono">
                  <span className="flex items-center gap-1 font-semibold text-stone-200">
                    <Calendar size={13} className="text-amber-400" /> {booking.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {booking.startTime} - {booking.endTime}
                  </span>
                  <span className="font-bold text-emerald-400 font-retro text-[10px]">
                    BOUNTY: +{booking.creditCost} COINS
                  </span>
                </div>

                {booking.learnerNotes && (
                  <p className="text-xs text-stone-300 italic bg-stone-950 p-2.5 border border-stone-800 mt-2 max-w-xl font-mono">
                    "{booking.learnerNotes}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAccept(booking._id)}
                      className="px-4 py-2 border-2 border-black bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[10px] font-bold font-retro uppercase shadow-[2px_2px_0px_0px_#000]"
                    >
                      ACCEPT
                    </button>
                    <button
                      onClick={() => handleReject(booking._id)}
                      className="px-3 py-2 border-2 border-black bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold font-retro uppercase shadow-[2px_2px_0px_0px_#000]"
                    >
                      DECLINE
                    </button>
                  </>
                )}

                {booking.status === 'confirmed' && (
                  <>
                    <Link
                      to={getMeetingUrl(booking)}
                      className="px-4 py-2 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 text-[10px] font-bold font-retro uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 transition-colors"
                    >
                      <Video size={13} /> JOIN ROOM
                    </Link>
                    <button
                      onClick={() => handleComplete(booking._id)}
                      className="px-4 py-2 border-2 border-black bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[10px] font-bold font-retro uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={13} /> COMPLETE
                    </button>
                  </>
                )}

                {booking.status === 'completed' && (
                  <span className="px-3 py-1.5 border-2 border-emerald-600 bg-emerald-950 text-emerald-300 text-[10px] font-bold font-retro flex items-center gap-1">
                    <CheckCircle2 size={13} /> COINS REWARDED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};