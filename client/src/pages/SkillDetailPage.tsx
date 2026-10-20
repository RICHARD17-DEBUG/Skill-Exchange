import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Video, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  BookOpen, 
  User, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import api from '../api/client';
import { ISkillListing, IReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { CreditBadge } from '../components/CreditBadge';
import { BookingModal } from '../components/BookingModal';

export const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ISkillListing | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    fetchListing();
    fetchReviews();
  }, [id]);

  const fetchListing = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/skills/${id}`);
      if (res.data.success) {
        setListing(res.data.listing);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/listing/${id}`);
      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Skill listing not found</h2>
        <Link to="/explore" className="text-sm font-semibold text-indigo-600 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  const provider = listing.provider;
  const isOwner = user?.id === provider?._id;
  const categoryName = typeof listing.category === 'object' ? listing.category.name : 'Skill';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Explore Skills</span>
      </Link>

      {/* Success Notification Banner */}
      {bookingSuccessRef && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Booking Request Submitted!</p>
              <p className="text-xs text-emerald-700">
                Reference: <span className="font-mono font-bold">{bookingSuccessRef}</span>. The provider will review your request.
              </p>
            </div>
          </div>
          <Link
            to="/learner/sessions"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700"
          >
            View My Sessions
          </Link>
        </div>
      )}

      {/* Main Grid: Left Content (2 cols) & Right Booking Card (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="retro-card bg-stone-900 border-2 border-black p-8 text-stone-100 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 border-2 border-amber-400 text-[10px] font-bold font-retro bg-stone-950 text-amber-300">
                {categoryName}
              </span>
              <span className="px-2.5 py-0.5 border border-stone-700 text-[10px] font-bold font-retro bg-stone-800 text-stone-300">
                {listing.proficiencyLevel}
              </span>
              <span className="px-2.5 py-0.5 border border-emerald-600 text-[10px] font-bold font-retro bg-emerald-950 text-emerald-300">
                {listing.sessionFormat}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-retro text-stone-100 tracking-tight leading-snug">
              {listing.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-stone-400 pt-2 border-t-2 border-stone-800 font-mono">
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <Star size={14} className="fill-amber-400" />
                <span>{listing.rating.toFixed(1)}</span>
                <span className="text-stone-500 font-normal">({listing.reviewCount} reviews)</span>
              </div>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-stone-400" />
                <span>{listing.durationMinutes} Minutes</span>
              </span>
              <span>{listing.totalBookings} Quests Completed</span>
            </div>

            {/* Description */}
            <div className="pt-4 border-t-2 border-stone-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-retro">[QUEST BRIEFING]</h3>
              <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-line font-mono">
                {listing.description}
              </p>
            </div>

            {/* Learning Outcomes */}
            {listing.learningOutcomes && listing.learningOutcomes.length > 0 && (
              <div className="pt-4 border-t-2 border-stone-800 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-retro">[ABILITIES UNLOCKED]</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300 font-mono">
                  {listing.learningOutcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {listing.prerequisites && listing.prerequisites.length > 0 && (
              <div className="pt-4 border-t-2 border-stone-800 space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-retro">[PREREQUISITES]</h3>
                <ul className="list-disc list-inside text-xs text-stone-400 space-y-1 font-mono">
                  {listing.prerequisites.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="pt-4 border-t-2 border-stone-800 flex flex-wrap gap-1.5">
                {listing.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 border border-stone-700 bg-stone-950 text-stone-300 text-xs font-mono font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Provider Card */}
          <div className="retro-card bg-stone-900 border-2 border-black p-6 text-stone-100 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-retro">[INSTRUCTOR PROFILE]</h3>
            <div className="flex items-start gap-4">
              <img
                src={provider?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider?.name || 'P')}&background=0c0a09&color=fbbf24`}
                alt={provider?.name}
                className="w-16 h-16 border-2 border-black object-cover shadow-[2px_2px_0px_0px_#000]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link to={`/providers/${provider?._id}`} className="font-bold text-sm text-stone-100 hover:text-amber-400 font-retro">
                    {provider?.name}
                  </Link>
                  {provider?.providerProfile?.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-600 bg-emerald-950 text-emerald-300 text-[9px] font-bold font-retro">
                      <CheckCircle2 size={11} /> VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono font-medium text-amber-300">{provider?.providerProfile?.headline || 'Skill Instructor'}</p>
                <p className="text-xs text-stone-400 leading-relaxed line-clamp-3 font-mono">{provider?.bio || provider?.providerProfile?.bio}</p>
              </div>
            </div>
          </div>

          {/* Student Reviews */}
          <div className="retro-card bg-stone-900 border-2 border-black p-6 text-stone-100 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 font-retro uppercase">[PLAYER LOGS ({reviews.length})]</h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 font-mono">No debrief logs yet for this quest. Be the first to embark and review!</p>
            ) : (
              <div className="space-y-3 divide-y-2 divide-stone-800">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.reviewer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer?.name || 'L')}&background=0c0a09&color=fbbf24`}
                          alt={rev.reviewer?.name}
                          className="w-6 h-6 border border-black object-cover"
                        />
                        <span className="text-xs font-mono font-bold text-stone-200">{rev.reviewer?.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={12} className="fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-300 font-mono">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="space-y-4">
          <div className="sticky top-24 retro-card bg-stone-900 border-2 border-black p-6 text-stone-100 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1 font-retro">[QUEST BOUNTY]</span>
              <div className="flex items-center justify-between">
                <CreditBadge amount={listing.creditCost} size="lg" variant="primary" />
                <span className="text-[10px] text-stone-400 font-mono">Non-Monetary</span>
              </div>
            </div>

            <div className="p-3.5 border-2 border-black bg-stone-950 text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-stone-400">
                <span>Duration</span>
                <span className="font-bold text-stone-200">{listing.durationMinutes} Minutes</span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Format</span>
                <span className="font-bold text-stone-200">{listing.sessionFormat}</span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Your Coins</span>
                <span className={`font-bold font-retro text-[10px] ${user && user.creditBalance >= listing.creditCost ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user ? `${user.creditBalance} COINS` : 'Sign in to view'}
                </span>
              </div>
            </div>

            {isOwner ? (
              <div className="p-3 border-2 border-stone-700 bg-stone-800 text-center text-xs font-retro text-[10px] text-stone-400">
                YOUR OWN SKILL OFFERING
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setIsBookingOpen(true);
                  }
                }}
                className="w-full py-3.5 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs font-retro uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                <span>BOOK MISSION</span>
              </button>
            )}

            <div className="pt-2 text-[10px] text-stone-400 text-center space-y-1 font-mono">
              <p>Coins deducted only when instructor confirms quest.</p>
              <p>Full coin refund on 24hr cancellation notice.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal
          listing={listing}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          onSuccess={(ref) => {
            setBookingSuccessRef(ref);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};