import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle2, BookOpen, Calendar, Clock, Video, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { IUser, ISkillListing, IReview } from '../types';
import { SkillCard } from '../components/SkillCard';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<IUser | null>(null);
  const [listings, setListings] = useState<ISkillListing[]>([]);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProviderData();
  }, [id]);

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      const [skillsRes, revsRes] = await Promise.all([
        api.get(`/skills?provider=${id}`),
        api.get(`/reviews/provider/${id}`)
      ]);

      if (skillsRes.data.success) {
        setListings(skillsRes.data.listings);
        if (skillsRes.data.listings.length > 0) {
          setProvider(skillsRes.data.listings[0].provider as any);
        }
      }
      if (revsRes.data.success) {
        setReviews(revsRes.data.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Directory
      </Link>

      {/* Provider Header Profile Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start gap-6">
        <img
          src={provider?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider?.name || 'P')}&background=6366f1&color=fff`}
          alt={provider?.name}
          className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-50 shrink-0"
        />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">{provider?.name}</h1>
            {provider?.providerProfile?.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 size={13} /> Verified Instructor
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-indigo-600">{provider?.providerProfile?.headline || 'Skill Provider'}</p>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{provider?.bio || provider?.providerProfile?.bio}</p>

          <div className="flex items-center gap-6 pt-3 text-xs text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <Star size={14} className="fill-amber-400" />
              <span>{provider?.providerProfile?.rating?.toFixed(1) || '5.0'}</span>
              <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
            </div>
            <span>{provider?.providerProfile?.yearsOfExperience || 3}+ Years Experience</span>
            <span>{listings.length} Published Skill Sessions</span>
          </div>
        </div>
      </div>

      {/* Published Listings */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Skill Sessions by {provider?.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <SkillCard key={l._id} listing={l} />
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Student Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No reviews submitted yet.</p>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {reviews.map((r) => (
              <div key={r._id} className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{r.reviewer?.name}</span>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};