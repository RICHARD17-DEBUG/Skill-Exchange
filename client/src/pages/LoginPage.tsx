import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, Shield, User, GraduationCap, Presentation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const expired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/learner/dashboard');
    } else {
      setErrorMsg(res.message || 'Login failed.');
    }
  };

  // 1-Click Demo Logins for smooth evaluation
  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setIsSubmitting(true);
    setErrorMsg('');
    const res = await login(demoEmail, 'Password123!');
    setIsSubmitting(false);
    if (res.success) {
      if (demoEmail.includes('admin')) navigate('/admin/dashboard');
      else if (demoEmail.includes('provider')) navigate('/provider/dashboard');
      else navigate('/learner/dashboard');
    } else {
      setErrorMsg(res.message || 'Demo login failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-stone-950 text-stone-100">
      <div className="max-w-md w-full space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 border-2 border-black bg-amber-400 text-black shadow-[3px_3px_0px_#000] font-pixel text-xl">
            👾
          </div>
          <h2 className="text-sm sm:text-base font-pixel text-amber-300 tracking-wide">[PLAYER AUTHENTICATION]</h2>
          <p className="font-retro-mono text-xs text-stone-400">Insert credentials to access coin vault and match rooms</p>
        </div>

        {expired && (
          <div className="p-3 border-2 border-amber-500 bg-amber-950 text-amber-200 font-retro-mono text-xs flex items-center gap-2 shadow-[2px_2px_0px_#000]">
            <AlertCircle size={15} className="text-amber-400 shrink-0" />
            <span>SESSION EXPIRED. INSERT CREDENTIALS AGAIN.</span>
          </div>
        )}

        {errorMsg && (
          <div className="retro-error-box p-3 font-retro-mono text-xs flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span className="font-semibold text-red-200">{errorMsg}</span>
          </div>
        )}

        {/* 1-Click Demo Accounts Box for Evaluators */}
        <div className="retro-card bg-stone-900 border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[8px] text-amber-400 uppercase tracking-wider">[QUICK DEMO PLAYERS]</span>
            <span className="font-retro-mono text-[9px] text-stone-400">Click to auto-login</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('alex.learner@example.com')}
              className="retro-btn p-2 bg-stone-800 hover:bg-stone-700 text-left text-xs border-black"
            >
              <div className="flex items-center gap-1 font-pixel text-[8px] text-amber-300">
                <GraduationCap size={11} className="text-amber-400" />
                <span>P1:LEARNER</span>
              </div>
              <p className="font-retro-mono text-[9px] text-stone-400 truncate mt-1">Alex Rivera</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('david.provider@example.com')}
              className="retro-btn p-2 bg-stone-800 hover:bg-stone-700 text-left text-xs border-black"
            >
              <div className="flex items-center gap-1 font-pixel text-[8px] text-emerald-400">
                <Presentation size={11} className="text-emerald-400" />
                <span>P2:MENTOR</span>
              </div>
              <p className="font-retro-mono text-[9px] text-stone-400 truncate mt-1">David Chen</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@skillexchange.org')}
              className="retro-btn p-2 bg-stone-800 hover:bg-stone-700 text-left text-xs border-black"
            >
              <div className="flex items-center gap-1 font-pixel text-[8px] text-red-400">
                <Shield size={11} className="text-red-400" />
                <span>ADMIN</span>
              </div>
              <p className="font-retro-mono text-[9px] text-stone-400 truncate mt-1">Eleanor</p>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="retro-card bg-stone-900 border-2 border-black p-5 sm:p-6 shadow-[4px_4px_0px_#000] space-y-4">
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
              PASSWORD
            </label>
            <input
              type="password"
              required
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
            <span>{isSubmitting ? 'AUTHENTICATING...' : 'SIGN IN / ENTER ARCADE'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-center font-retro-mono text-xs text-stone-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-amber-400 hover:underline">
            Register and get 100 free coins
          </Link>
        </p>
      </div>
    </div>
  );
};