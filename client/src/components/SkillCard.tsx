import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Video, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { ISkillListing } from '../types';
import { CreditBadge } from './CreditBadge';

interface SkillCardProps {
  listing: ISkillListing;
}

export const SkillCard: React.FC<SkillCardProps> = ({ listing }) => {
  const categoryName = typeof listing.category === 'object' ? listing.category.name : 'General';
  const provider = listing.provider;
  const isVerified = provider?.providerProfile?.isVerified;

  const levelColorMap: Record<string, string> = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
    'All Levels': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="group flex flex-col retro-card bg-stone-900 border-2 border-black shadow-[3px_3px_0px_#000] hover:shadow-[5px_5px_0px_#000] text-stone-100 transition-all duration-150 overflow-hidden">
      {/* Top Header: Category & Level */}
      <div className="p-4 pb-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="retro-chip font-pixel text-[8px] bg-stone-800 text-amber-300 border border-black px-2 py-0.5 flex items-center gap-1 shadow-sm">
            <BookOpen size={11} />
            <span>{categoryName.toUpperCase()}</span>
          </span>
          <span className="font-pixel text-[8px] border border-black bg-stone-950 text-stone-300 px-1.5 py-0.5">
            {listing.proficiencyLevel.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <Link to={`/skills/${listing._id}`} className="block">
          <h3 className="font-pixel text-xs text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-relaxed">
            {listing.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="font-retro-mono text-xs text-stone-400 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>
      </div>

      {/* Meta Specs: Duration, Format, Rating */}
      <div className="px-4 py-2 flex items-center justify-between font-retro-mono text-xs text-stone-300 border-t-2 border-b-2 border-black bg-stone-950">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-amber-400" />
            <span>{listing.durationMinutes}m</span>
          </span>
          <span className="flex items-center gap-1">
            <Video size={12} className="text-stone-400" />
            <span>{listing.sessionFormat}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 font-bold text-amber-400">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span>{listing.rating.toFixed(1)}</span>
          <span className="text-stone-500 font-normal">({listing.reviewCount})</span>
        </div>
      </div>

      {/* Footer: Provider Info & Skill Credit Cost */}
      <div className="p-3 mt-auto flex items-center justify-between gap-3 bg-stone-900">
        <Link
          to={`/providers/${provider?._id}`}
          className="flex items-center gap-2 min-w-0"
        >
          <img
            src={provider?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider?.name || 'P')}&background=44403c&color=facc15&bold=true`}
            alt={provider?.name}
            className="w-7 h-7 border border-black object-cover"
          />
          <div className="truncate">
            <div className="flex items-center gap-1">
              <span className="font-pixel text-[8px] text-stone-300 hover:text-amber-400 truncate">
                {provider?.name}
              </span>
              {isVerified && (
                <span title="Verified Provider"><CheckCircle2 size={11} className="text-emerald-400 shrink-0" /></span>
              )}
            </div>
          </div>
        </Link>

        {/* Credit Cost Badge */}
        <div className="shrink-0">
          <CreditBadge amount={listing.creditCost} size="sm" />
        </div>
      </div>

      {/* Book Action Strip */}
      <Link
        to={`/skills/${listing._id}`}
        className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-black font-pixel text-[9px] font-bold flex items-center justify-center gap-1.5 transition-colors border-t-2 border-black"
      >
        <span>[VIEW QUEST & BOOK]</span>
        <ChevronRight size={13} />
      </Link>
    </div>
  );
};