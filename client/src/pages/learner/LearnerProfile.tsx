import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const LearnerProfile: React.FC = () => {
  const { user, updateUserContext } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [interestsStr, setInterestsStr] = useState((user?.interests || []).join(', '));
  const [skillsToLearnStr, setSkillsToLearnStr] = useState((user?.skillsToLearn || []).join(', '));

  // Provider application section
  const [providerHeadline, setProviderHeadline] = useState(user?.providerProfile?.headline || '');
  const [providerYears, setProviderYears] = useState(user?.providerProfile?.yearsOfExperience || 1);
  const [verificationNotes, setVerificationNotes] = useState(user?.providerProfile?.verificationNotes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const interests = interestsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      const skillsToLearn = skillsToLearnStr.split(',').map((s: string) => s.trim()).filter(Boolean);

      const res = await api.put('/auth/profile', {
        name,
        bio,
        avatar,
        interests,
        skillsToLearn,
        providerProfile: {
          headline: providerHeadline,
          yearsOfExperience: Number(providerYears),
        },
      });

      if (res.data.success) {
        updateUserContext(res.data.user);
        setSuccessMsg('Profile updated successfully.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      const res = await api.post('/auth/request-verification', {
        notes: verificationNotes,
      });
      if (res.data.success) {
        setSuccessMsg('Verification application submitted for administrator review.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit verification request.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link to="/learner/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Personal Profile & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your public information, learning interests, and provider verification.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 border-2 border-emerald-600 bg-emerald-950/80 text-xs text-emerald-200 flex items-center gap-2 font-mono">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="retro-error-box p-3.5 border-2 border-red-600 bg-[#450a0a] text-xs text-red-200 flex items-center gap-2 font-mono">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="retro-card bg-stone-900 border-2 border-black p-8 text-stone-100 space-y-6">
        <div className="flex items-center gap-5">
          <img
            src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0c0a09&color=fbbf24`}
            alt={name}
            className="w-16 h-16 border-2 border-black object-cover shadow-[2px_2px_0px_0px_#000]"
          />
          <div className="flex-1">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 font-retro text-[10px]">
              AVATAR IMAGE URL
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              FULL NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              EMAIL ADDRESS (PLAYER ID)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 text-xs border-2 border-black bg-stone-950 text-stone-500 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
            PLAYER BIO
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell fellow guild members about yourself..."
            className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none resize-none font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              MY INTERESTS (COMMA-SEPARATED)
            </label>
            <input
              type="text"
              value={interestsStr}
              onChange={(e) => setInterestsStr(e.target.value)}
              placeholder="React, Distributed Systems, Design"
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              SKILLS TO LEARN (COMMA-SEPARATED)
            </label>
            <input
              type="text"
              value={skillsToLearnStr}
              onChange={(e) => setSkillsToLearnStr(e.target.value)}
              placeholder="Python Automation, Pixel Art, Shader Dev"
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Provider Verification Application Section */}
        <div className="pt-6 border-t-2 border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-amber-400 font-retro uppercase">PROVIDER CREDENTIALS</h3>
              <p className="text-xs text-stone-400 font-mono">Unlock teacher status to host quests and earn coin bounties.</p>
            </div>
            {user?.providerProfile?.isVerified ? (
              <span className="px-3 py-1 border-2 border-emerald-600 bg-emerald-950 text-emerald-300 text-[10px] font-bold font-retro flex items-center gap-1">
                <CheckCircle2 size={13} /> VERIFIED INSTRUCTOR
              </span>
            ) : user?.providerProfile?.verificationStatus === 'pending' ? (
              <span className="px-3 py-1 border-2 border-amber-600 bg-amber-950 text-amber-300 text-[10px] font-bold font-retro">
                PENDING REVIEW
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestVerification}
                className="px-3 py-1.5 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 text-[10px] font-bold font-retro uppercase shadow-[2px_2px_0px_0px_#000]"
              >
                APPLY FOR VERIFICATION
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                INSTRUCTOR HEADLINE
              </label>
              <input
                type="text"
                value={providerHeadline}
                onChange={(e) => setProviderHeadline(e.target.value)}
                placeholder="Senior Full-Stack Developer & Python Mentor"
                className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                YEARS OF EXPERIENCE
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={providerYears}
                onChange={(e) => setProviderYears(Number(e.target.value))}
                className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs font-retro uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isSaving ? 'SAVING...' : 'SAVE PLAYER DATA'}
          </button>
        </div>
      </form>
    </div>
  );
};