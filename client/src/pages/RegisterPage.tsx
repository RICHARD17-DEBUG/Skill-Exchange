import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2, GraduationCap, Presentation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : 'learner';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'learner' | 'provider'>(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const res = await register(name, email, password, role);
    setIsSubmitting(false);

    if (res.success) {
      if (role === 'provider') {
        navigate('/provider/dashboard');
      } else {
        navigate('/learner/dashboard');
      }
    } else {
      setErrorMsg(res.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-stone-950 text-stone-100">
      <div className="max-w-md w-full space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-black bg-amber-400 text-black shadow-[3px_3px_0px_#000] font-pixel text-xl">
            🪙
          </div>
          <h2 className="text-sm sm:text-base font-pixel text-amber-300 tracking-wide">[PLAYER REGISTRATION]</h2>
          <p className="font-retro-mono text-xs text-stone-400">Join the skill exchange co-op & claim 100 starter coins</p>
        </div>

        {/* Welcome Bonus Notice */}
        <div className="retro-card bg-stone-900 border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] text-stone-100 flex items-center gap-3">
          <div className="p-2 border-2 border-black bg-amber-400 text-black font-bold shrink-0">
            🪙
          </div>
          <div className="font-retro-mono text-xs">
            <span className="font-pixel text-[9px] text-amber-300 block">100 SKILL COINS SIGN-UP BOUNTY</span>
            <span className="text-stone-300">Available immediately in your vault for 1-on-1 matches.</span>
          </div>
        </div>

        {errorMsg && (
          <div className="retro-error-box p-3 font-retro-mono text-xs flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span className="font-semibold text-red-200">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="retro-card bg-stone-900 border-2 border-black p-5 sm:p-6 shadow-[4px_4px_0px_#000] space-y-4">
          {/* Initial Role Selection */}
          <div>
            <label className="block font-pixel text-[8px] text-stone-300 uppercase tracking-wider mb-2">
              SELECT STARTING CLASS
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('learner')}
                className={`p-2.5 border-2 border-black text-left text-xs transition-all ${
                  role === 'learner'
                    ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#000] font-bold'
                    : 'bg-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-pixel text-[8px] mb-1">
                  <GraduationCap size={13} />
                  <span>P1: LEARNER</span>
                </div>
                <p className="font-retro-mono text-[9px] opacity-90">Stake coins on mentors</p>
              </button>

              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`p-2.5 border-2 border-black text-left text-xs transition-all ${
                  role === 'provider'
                    ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_#000] font-bold'
                    : 'bg-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-pixel text-[8px] mb-1">
                  <Presentation size={13} />
                  <span>P2: PROVIDER</span>
                </div>
                <p className="font-retro-mono text-[9px] opacity-90">Teach & earn bounties</p>
              </button>
            </div>
            <p className="font-retro-mono text-[10px] text-stone-400 mt-1.5">You can switch classes anytime in the game.</p>
          </div>

          <div>
            <label className="block font-pixel text-[8px] text-stone-300 uppercase tracking-wider mb-1.5">
              PLAYER NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              className="retro-input w-full px-3 py-2 text-xs font-retro-mono"
            />
          </div>

          <div>
            <label className="block font-pixel text-[8px] text-stone-300 uppercase tracking-wider mb-1.5">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              className="retro-input w-full px-3 py-2 text-xs font-retro-mono"
            />
          </div>

          <div>
            <label className="block font-pixel text-[8px] text-stone-300 uppercase tracking-wider mb-1.5">
              PASSWORD (MIN 6 CHARACTERS)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="retro-input w-full px-3 py-2 text-xs font-retro-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="retro-btn font-pixel text-[9px] w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'INITIALIZING ACCOUNT...' : 'REGISTER & CLAIM 100 COINS'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-center font-retro-mono text-xs text-stone-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-amber-400 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};