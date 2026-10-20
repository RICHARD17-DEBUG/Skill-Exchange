import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Repeat, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-10 border-t-2 border-black font-retro-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 border-2 border-black bg-amber-400 flex items-center justify-center text-black font-pixel text-xs shadow-[2px_2px_0px_#000]">
                👾
              </div>
              <span className="font-pixel text-xs text-stone-100">
                SKILL<span className="text-amber-400">EXCHANGE</span>
              </span>
            </Link>
            <p className="text-xs text-stone-400 leading-relaxed">
              A purely non-monetary learning arcade where players exchange skills using tokens. Teach what you master, level up what you need.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 retro-chip font-pixel text-[8px] bg-stone-950 text-amber-300 border border-black shadow-sm">
              <Shield size={12} className="text-amber-400" />
              <span>100% NON-MONETARY COIN SYSTEM</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-pixel text-[9px] text-amber-300 mb-3 uppercase tracking-wider">[SKILL CATEGORIES]</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore?category=programming-tech" className="hover:text-amber-400 transition">Programming & Tech</Link></li>
              <li><Link to="/explore?category=design-creative" className="hover:text-amber-400 transition">Design & Creative</Link></li>
              <li><Link to="/explore?category=data-science-ai" className="hover:text-amber-400 transition">Data Science & AI</Link></li>
              <li><Link to="/explore?category=video-audio" className="hover:text-amber-400 transition">Video & Audio</Link></li>
              <li><Link to="/explore" className="hover:text-amber-400 transition">All Realms</Link></li>
            </ul>
          </div>

          {/* Platform Roles */}
          <div>
            <h4 className="font-pixel text-[9px] text-amber-300 mb-3 uppercase tracking-wider">[PLAYER MODES]</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/register?role=learner" className="hover:text-amber-400 transition">P1: Skill Seeker (Learner)</Link></li>
              <li><Link to="/register?role=provider" className="hover:text-amber-400 transition">P2: Skill Provider (Mentor)</Link></li>
              <li><Link to="/login" className="hover:text-amber-400 transition">Mentor Verification</Link></li>
              <li><Link to="/login" className="hover:text-amber-400 transition">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Credit Economy Rules */}
          <div>
            <h4 className="font-pixel text-[9px] text-amber-300 mb-3 uppercase tracking-wider">[ARCADE RULES]</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-start gap-2">
                <Repeat size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Earn coins by teaching; stake coins to unlock sessions.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span>Zero real-world currency or payment fees allowed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0">🪙</span>
                <span>100 Welcome Coins granted on registration.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-black font-retro-mono text-xs text-stone-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} SKILL EXCHANGE ARCADE. CO-OP LEARNING PLATFORM.</p>
          <p className="flex items-center gap-1">
            Built with React & WebSockets <Heart size={12} className="text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};