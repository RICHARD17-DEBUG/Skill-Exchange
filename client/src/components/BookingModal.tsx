import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react';
import api from '../api/client';
import { ISkillListing, IAvailabilitySlot } from '../types';
import { useAuth } from '../context/AuthContext';
import { CreditBadge } from './CreditBadge';

interface BookingModalProps {
  listing: ISkillListing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingRef: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [availableSlots, setAvailableSlots] = useState<IAvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<IAvailabilitySlot | null>(null);
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('10:00');
  const [learnerNotes, setLearnerNotes] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && listing.provider?._id) {
      fetchSlots();
    }
  }, [isOpen, listing.provider?._id]);

  const fetchSlots = async () => {
    try {
      setIsLoadingSlots(true);
      const res = await api.get(`/availability/provider/${listing.provider._id}`);
      if (res.data.success) {
        setAvailableSlots(res.data.slots);
        if (res.data.slots.length > 0) {
          setSelectedSlot(res.data.slots[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const userBalance = user?.creditBalance ?? 0;
  const hasSufficientCredits = userBalance >= listing.creditCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!hasSufficientCredits) {
      setErrorMsg(`You need ${listing.creditCost} credits, but your current balance is ${userBalance} credits. Earn credits by teaching or request an admin grant.`);
      return;
    }

    let date = selectedSlot?.date || customDate;
    let startTime = selectedSlot?.startTime || customTime;
    let endTime = selectedSlot?.endTime;

    if (!date || !startTime) {
      setErrorMsg('Please select an available session date and time slot.');
      return;
    }

    if (!endTime) {
      // Calculate end time based on durationMinutes
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + (listing.durationMinutes || 60);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        skillListingId: listing._id,
        date,
        startTime,
        endTime,
        learnerNotes,
      };

      if (selectedSlot) {
        payload.slotId = selectedSlot._id;
      }

      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        await refreshUser();
        onSuccess(res.data.booking.bookingReference);
        onClose();
      } else {
        setErrorMsg(res.data.message || 'Failed to submit booking request.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit booking request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="retro-card bg-stone-900 border-2 border-black max-w-lg w-full text-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-stone-950 border-b-2 border-black flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold font-retro text-amber-400 uppercase tracking-wider">[MISSION RESERVATION]</span>
            <h3 className="text-base font-bold text-stone-100 mt-1 line-clamp-1">{listing.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-stone-700 bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Credit Cost & Balance Validation Banner */}
          <div className={`p-4 border-2 border-black flex items-center justify-between ${
            hasSufficientCredits 
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200' 
              : 'bg-amber-950/70 border-amber-800 text-amber-200'
          }`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-retro">COIN COST</p>
              <div className="mt-1">
                <CreditBadge amount={listing.creditCost} size="md" variant={hasSufficientCredits ? 'primary' : 'outline'} />
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-retro">YOUR WALLET</p>
              <p className={`text-base font-bold mt-0.5 font-retro ${hasSufficientCredits ? 'text-emerald-400' : 'text-amber-400'}`}>
                {userBalance} COINS
              </p>
            </div>
          </div>

          {!hasSufficientCredits && (
            <div className="retro-error-box p-3 border-2 border-amber-600 bg-amber-950/80 text-xs text-amber-200 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                INSUFFICIENT COINS: You need {listing.creditCost} coins for this quest. Teach skills or complete quests to claim more!
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="retro-error-box p-3 border-2 border-red-600 bg-[#450a0a] text-xs text-red-200 flex items-start gap-2 font-mono">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Provider's Available Time Slots */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 font-retro">
              SELECT TIME SLOT
            </label>

            {isLoadingSlots ? (
              <p className="text-xs text-stone-400 py-3 font-mono">Scanning instructor calendar...</p>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?._id === slot._id;
                  return (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setCustomDate('');
                      }}
                      className={`p-2.5 border-2 text-left text-xs transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-stone-950 text-amber-300 font-bold shadow-[2px_2px_0px_0px_rgba(251,191,36,0.8)]'
                          : 'border-black bg-stone-800 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Calendar size={13} className="text-amber-400" />
                        <span>{slot.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-400 mt-1 font-mono text-[11px]">
                        <Clock size={12} />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-stone-400 font-mono">
                  No predefined slots found. Propose your preferred date & time:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1 font-retro uppercase">Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1 font-retro uppercase">Start Time</label>
                    <input
                      type="time"
                      required
                      value={customTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Learner Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro">
              MISSION BRIEF / NOTES (OPTIONAL)
            </label>
            <textarea
              rows={3}
              value={learnerNotes}
              onChange={(e) => setLearnerNotes(e.target.value)}
              placeholder="e.g. I want to level up on React hooks, async patterns, and code architecture."
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none resize-none font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-stone-700 bg-stone-800 text-xs font-bold text-stone-300 hover:bg-stone-700 transition-colors uppercase font-retro text-[10px]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasSufficientCredits}
              className={`px-5 py-2.5 border-2 border-black text-xs font-bold font-retro text-[10px] uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 ${
                isSubmitting || !hasSufficientCredits
                  ? 'bg-stone-700 text-stone-500 cursor-not-allowed opacity-70'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
              }`}
            >
              <Sparkles size={14} className="text-stone-950" />
              <span>{isSubmitting ? 'TRANSMITTING...' : `CONFIRM QUEST (${listing.creditCost} COINS)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};