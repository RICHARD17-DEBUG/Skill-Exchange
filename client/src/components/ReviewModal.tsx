import React, { useState } from 'react';
import { Star, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { IBooking } from '../types';

interface ReviewModalProps {
  booking: IBooking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!comment.trim()) {
      setErrorMsg('Please write a brief feedback comment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.data.message || 'Failed to submit review.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="retro-card bg-stone-900 border-2 border-black max-w-md w-full text-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 bg-stone-950 border-b-2 border-black flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold font-retro text-amber-400 uppercase tracking-wider">[MISSION DEBRIEF]</span>
            <h3 className="text-base font-bold text-stone-100 mt-1 font-retro text-xs">RATE INSTRUCTOR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-stone-700 bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 border-2 border-black bg-stone-950 text-xs">
            <p className="font-bold text-stone-100">{booking.skillListing?.title}</p>
            <p className="text-amber-400 mt-1 font-mono text-[11px]">Instructor: {booking.provider?.name}</p>
          </div>

          {errorMsg && (
            <div className="retro-error-box p-3 border-2 border-red-600 bg-[#450a0a] text-xs text-red-200 flex items-start gap-2 font-mono">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 font-retro text-[10px]">
              MISSION SCORE
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      size={26}
                      className={isFilled ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-amber-400 ml-2 font-retro">{rating}/5 STARS</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              PLAYER LOG & FEEDBACK
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the session? Did you achieve your learning objectives?"
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none resize-none font-mono"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 border-2 border-black text-xs font-bold font-retro text-[10px] uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 bg-amber-400 hover:bg-amber-300 text-stone-950 disabled:opacity-50"
            >
              {isSubmitting ? 'SUBMITTING...' : 'TRANSMIT REVIEW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};