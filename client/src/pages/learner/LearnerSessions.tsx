import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Video, 
  Star, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import api from '../../api/client';
import { IBooking } from '../../types';
import { ReviewModal } from '../../components/ReviewModal';
import { getMeetingUrl } from '../../lib/utils';

export const LearnerSessions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const autoReviewBookingId = searchParams.get('review');

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState<IBooking | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const params: any = { role: 'learner' };
      if (activeTab !== 'all') params.status = activeTab;

      const res = await api.get('/bookings', { params });
      if (res.data.success) {
        setBookings(res.data.bookings);
        // If query param review matches
        if (autoReviewBookingId) {
          const match = res.data.bookings.find((b: IBooking) => b._id === autoReviewBookingId);
          if (match && !match.hasReview) setReviewBooking(match);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    const reason = prompt('Please provide a reason for cancelling this booking:');
    if (!reason) return;

    try {
      const res = await api.put(`/bookings/${id}/cancel`, { reason });
      if (res.data.success) {
        setActionMsg('Booking cancelled successfully. Credits refunded if previously deducted.');
        fetchBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-stone-950 text-stone-100">
      <Link to="/learner/dashboard" className="retro-btn inline-flex items-center gap-1.5 font-pixel text-[9px] px-3 py-1.5 bg-stone-800 text-stone-300 hover:text-white">
        <ArrowLeft size={12} /> [BACK TO DASHBOARD]
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-pixel text-amber-300">MY SESSION QUESTS</h1>
          <p className="font-retro-mono text-xs text-stone-400 mt-1">Track challenge schedules, enter live video links, and claim victory ratings.</p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 border-2 border-black bg-emerald-950 text-emerald-200 font-retro-mono text-xs flex items-center justify-between shadow-[2px_2px_0px_#000]">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-3 text-xs overflow-x-auto">
        {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`retro-btn font-pixel text-[9px] px-3.5 py-2 uppercase whitespace-nowrap ${
              activeTab === tab
                ? 'bg-amber-400 text-black font-bold'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            [{tab}]
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 retro-card bg-stone-900 border-2 border-black animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="retro-card bg-stone-900 border-2 border-black p-10 text-center space-y-3 shadow-[4px_4px_0px_#000]">
          <Calendar size={32} className="mx-auto text-stone-500" />
          <h3 className="font-pixel text-xs text-stone-300">NO {activeTab !== 'all' ? activeTab.toUpperCase() : ''} QUESTS FOUND</h3>
          <p className="font-retro-mono text-xs text-stone-400">Explore our skill board and stake coins for your next 1-on-1 match.</p>
          <Link to="/explore" className="inline-block retro-btn font-pixel text-[9px] px-4 py-2 bg-amber-400 text-black font-bold">
            [BROWSE SKILLS]
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="retro-card bg-stone-900 border-2 border-black p-4 sm:p-5 shadow-[3px_3px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`retro-chip font-pixel text-[8px] px-2 py-0.5 uppercase ${
                    booking.status === 'confirmed' 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : booking.status === 'pending'
                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                      : 'bg-stone-950 text-stone-400 border-stone-700'
                  }`}>
                    {booking.status}
                  </span>
                  <span className="font-retro-mono text-[10px] text-stone-500">REF: {booking.bookingReference}</span>
                </div>

                <h3 className="font-pixel text-xs text-stone-100 truncate">
                  {booking.skillListing?.title || 'Skill Session'}
                </h3>

                <p className="font-retro-mono text-xs text-stone-300">
                  Mentor: <span className="font-bold text-amber-300">{booking.provider?.name}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 font-retro-mono text-xs text-stone-400 pt-1">
                  <span className="flex items-center gap-1 font-bold text-stone-200">
                    <Calendar size={12} className="text-amber-400" /> {booking.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {booking.startTime} - {booking.endTime} ({booking.durationMinutes}m)
                  </span>
                  <span className="font-pixel text-[9px] text-amber-400">
                    🪙 {booking.creditCost} COINS {booking.creditDeducted ? '(ESCROW RESERVED)' : '(PENDING)'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                {booking.status === 'confirmed' && (
                  <Link
                    to={getMeetingUrl(booking)}
                    className="retro-btn font-pixel text-[9px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Video size={13} />
                    <span>ENTER ROOM</span>
                  </Link>
                )}

                {booking.status === 'completed' && !booking.hasReview && (
                  <button
                    onClick={() => setReviewBooking(booking)}
                    className="retro-btn font-pixel text-[9px] px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Star size={13} className="fill-black" />
                    <span>RATE MENTOR</span>
                  </button>
                )}

                {booking.status === 'completed' && booking.hasReview && (
                  <span className="retro-chip font-pixel text-[8px] bg-emerald-950 text-emerald-300 border-emerald-600 px-2 py-1">
                    <CheckCircle2 size={12} className="inline mr-1" /> REVIEWED
                  </span>
                )}

                {['pending', 'confirmed'].includes(booking.status) && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="retro-btn font-pixel text-[8px] px-3 py-2 bg-stone-800 text-red-400 hover:bg-stone-700"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            fetchBookings();
            setActionMsg('Thank you! Your feedback has been recorded and provider rating updated.');
          }}
        />
      )}
    </div>
  );
};