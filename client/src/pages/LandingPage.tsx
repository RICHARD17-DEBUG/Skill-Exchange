import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Repeat, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  TrendingUp, 
  Video, 
  Search,
  Gamepad2,
  Coins,
  Compass,
  Trophy
} from 'lucide-react';
import api from '../api/client';
import { ISkillListing, ISkillCategory } from '../types';
import { SkillCard } from '../components/SkillCard';
import { CreditBadge } from '../components/CreditBadge';

export const LandingPage: React.FC = () => {
  const [featuredSkills, setFeaturedSkills] = useState<ISkillListing[]>([]);
  const [categories, setCategories] = useState<ISkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [skillsRes, catRes] = await Promise.all([
          api.get('/skills?limit=6&sort=popular'),
          api.get('/categories')
        ]);
        if (skillsRes.data.success) setFeaturedSkills(skillsRes.data.listings);
        if (catRes.data.success) setCategories(catRes.data.categories);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Retro Gamified Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Mission Directive Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-black bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-bold font-retro uppercase shadow-[3px_3px_0px_0px_#000]">
            <Coins size={14} className="text-stone-950" />
            <span>NON-MONETARY • 100% SKILL-COIN EXCHANGE</span>
          </div>

          {/* Gamified Retro Title (No blurry neon) */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-retro tracking-wide text-stone-100 uppercase leading-snug sm:leading-tight">
              TEACH WHAT YOU KNOW. <br />
              <span className="text-amber-400 inline-block mt-2">
                LEVEL UP WHAT YOU LOVE.
              </span>
            </h1>
          </div>

          {/* Retro Subtext */}
          <p className="text-sm sm:text-base text-stone-300 font-mono leading-relaxed max-w-2xl mx-auto">
            A peer-to-peer guild where knowledge is the only currency. Mentor fellow adventurers to harvest skill coins, then spend your bounty to unlock 1-on-1 mastery sessions with master instructors.
          </p>

          {/* Arcade Call-To-Action Controls */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold font-retro text-xs sm:text-sm uppercase shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              <Gamepad2 size={18} />
              <span>START QUEST: GET 100 COINS</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto px-8 py-4 border-2 border-black bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold font-retro text-xs sm:text-sm uppercase shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Search size={16} className="text-amber-400" />
              <span>EXPLORE DIRECTORY</span>
            </Link>
          </div>

          {/* Quick Retro Trust Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-mono text-stone-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-stone-800 bg-stone-950 text-stone-300">
              <CheckCircle2 size={14} className="text-emerald-400" />
              ZERO REAL CURRENCY
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-stone-800 bg-stone-950 text-stone-300">
              <ShieldCheck size={14} className="text-amber-400" />
              VERIFIED INSTRUCTORS
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-stone-800 bg-stone-950 text-stone-300">
              <Coins size={14} className="text-amber-400" />
              IMMUTABLE COIN LEDGER
            </span>
          </div>
        </div>
      </section>

      {/* How the Credit Economy Works (Retro Stages) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 border border-black bg-stone-800 text-amber-400 text-[10px] font-bold font-retro uppercase mb-2">
            [THE 3-STAGE GAME LOOP]
          </span>
          <h2 className="text-lg sm:text-2xl font-bold font-retro text-stone-100 uppercase">
            HOW KNOWLEDGE TRADING WORKS
          </h2>
          <p className="text-stone-400 font-mono text-xs sm:text-sm mt-2">
            Experience points and coins earned purely by passing knowledge forward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stage 1 */}
          <div className="retro-card bg-stone-900 border-2 border-black p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 border-2 border-black bg-amber-400 text-stone-950 flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
              <Coins size={24} />
            </div>
            <span className="text-[10px] font-bold font-retro text-amber-400 uppercase tracking-wider block">STAGE 01</span>
            <h3 className="text-sm font-bold font-retro text-stone-100 uppercase">
              CLAIM 100 WELCOME COINS
            </h3>
            <p className="text-xs text-stone-300 font-mono leading-relaxed">
              Every newly spawned player instantly receives 100 skill coins in their platform wallet. Book your first tutoring session immediately without upfront teaching requirements.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="retro-card bg-stone-900 border-2 border-black p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 border-2 border-black bg-emerald-500 text-stone-950 flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
              <Compass size={24} />
            </div>
            <span className="text-[10px] font-bold font-retro text-emerald-400 uppercase tracking-wider block">STAGE 02</span>
            <h3 className="text-sm font-bold font-retro text-stone-100 uppercase">
              JOIN 1-ON-1 SESSIONS
            </h3>
            <p className="text-xs text-stone-300 font-mono leading-relaxed">
              Find seasoned masters in React, Python, Systems, or Pixel Art. Spend coins only when your quest reservation is accepted and confirmed by your instructor.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="retro-card bg-stone-900 border-2 border-black p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 border-2 border-black bg-sky-400 text-stone-950 flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
              <Trophy size={24} />
            </div>
            <span className="text-[10px] font-bold font-retro text-sky-400 uppercase tracking-wider block">STAGE 03</span>
            <h3 className="text-sm font-bold font-retro text-stone-100 uppercase">
              TEACH & HARVEST BOUNTIES
            </h3>
            <p className="text-xs text-stone-300 font-mono leading-relaxed">
              Broadcast your skill listings and availability windows. Complete live tutoring sessions to earn coin bounties deposited straight into your permanent ledger.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Categories (Retro Arcade Grid) */}
      <section className="bg-stone-950/80 py-16 border-y-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[10px] font-bold font-retro text-amber-400 uppercase tracking-wider block mb-1">
                [SKILL REALMS]
              </span>
              <h2 className="text-lg sm:text-2xl font-bold font-retro text-stone-100 uppercase">
                EXPLORE DOMAINS
              </h2>
            </div>
            <Link to="/explore" className="text-xs font-bold font-retro text-amber-400 hover:text-amber-300 flex items-center gap-1.5 uppercase">
              <span>VIEW ALL DOMAINS</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/explore?category=${cat._id}`}
                className="retro-card bg-stone-900 hover:bg-stone-800 p-5 text-center flex flex-col items-center justify-center group border-2 border-black"
              >
                <div className="w-10 h-10 border-2 border-black bg-stone-950 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors shadow-[2px_2px_0px_0px_#000]">
                  <BookOpen size={18} />
                </div>
                <h4 className="text-xs font-bold font-retro text-stone-100 group-hover:text-amber-400 transition-colors uppercase">
                  {cat.name}
                </h4>
                <p className="text-[11px] text-stone-400 font-mono mt-1 line-clamp-1">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Skills Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold font-retro text-amber-400 uppercase tracking-wider block mb-1">
              [ACTIVE MISSIONS]
            </span>
            <h2 className="text-lg sm:text-2xl font-bold font-retro text-stone-100 uppercase">
              FEATURED SKILL SESSIONS
            </h2>
          </div>
          <Link to="/explore" className="text-xs font-bold font-retro text-amber-400 hover:text-amber-300 flex items-center gap-1.5 uppercase">
            <span>EXPLORE ALL MISSIONS</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 border-2 border-black bg-stone-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSkills.map((listing) => (
              <SkillCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Retro Arcade Boss CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="retro-card bg-stone-950 border-4 border-amber-400 p-8 sm:p-12 text-stone-100 relative overflow-hidden shadow-[6px_6px_0px_0px_#000]">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-amber-400 text-stone-950 text-[10px] font-bold font-retro uppercase">
              <Sparkles size={12} className="text-stone-950" />
              100% FREE FOREVER • ZERO FIAT MONEY
            </span>
            <h2 className="text-xl sm:text-3xl font-black font-retro tracking-wide uppercase text-stone-100">
              READY TO TRADE SKILLS AND LEVEL UP WITH REAL EXPERTS?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-mono leading-relaxed">
              Create your player avatar in seconds. You will immediately be credited with 100 skill coins to book your first mentor quest today.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold font-retro text-xs uppercase shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 transition-all"
              >
                <span>CREATE PLAYER PROFILE</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};