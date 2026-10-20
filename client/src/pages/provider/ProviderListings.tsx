import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Clock, Star, Edit, Trash2, ArrowLeft, Check, X, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { ISkillListing, ISkillCategory } from '../../types';
import { CreditBadge } from '../../components/CreditBadge';

export const ProviderListings: React.FC = () => {
  const [listings, setListings] = useState<ISkillListing[]>([]);
  const [categories, setCategories] = useState<ISkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ISkillListing | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('All Levels');
  const [creditCost, setCreditCost] = useState(40);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [sessionFormat, setSessionFormat] = useState('1-on-1 Video');
  const [tagsStr, setTagsStr] = useState('');
  const [outcomesStr, setOutcomesStr] = useState('');
  const [prereqStr, setPrereqStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadListings();
    loadCategories();
  }, []);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/skills/my/listings');
      if (res.data.success) {
        setListings(res.data.listings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
        if (res.data.categories.length > 0) setCategoryId(res.data.categories[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingListing(null);
    setTitle('');
    setDescription('');
    setCreditCost(40);
    setDurationMinutes(60);
    setSessionFormat('1-on-1 Video');
    setProficiencyLevel('All Levels');
    setTagsStr('');
    setOutcomesStr('');
    setPrereqStr('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (listing: ISkillListing) => {
    setEditingListing(listing);
    setTitle(listing.title);
    setDescription(listing.description);
    setCategoryId(typeof listing.category === 'object' ? (listing.category as any)._id : listing.category);
    setProficiencyLevel(listing.proficiencyLevel);
    setCreditCost(listing.creditCost);
    setDurationMinutes(listing.durationMinutes);
    setSessionFormat(listing.sessionFormat);
    setTagsStr((listing.tags || []).join(', '));
    setOutcomesStr((listing.learningOutcomes || []).join('\n'));
    setPrereqStr((listing.prerequisites || []).join('\n'));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (creditCost < 5 || creditCost > 200) {
      setFormError('Credit cost must be between 5 and 200 credits.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title,
        description,
        category: categoryId,
        proficiencyLevel,
        creditCost: Number(creditCost),
        durationMinutes: Number(durationMinutes),
        sessionFormat,
        tags: tagsStr.split(',').map((s) => s.trim()).filter(Boolean),
        learningOutcomes: outcomesStr.split('\n').map((s) => s.trim()).filter(Boolean),
        prerequisites: prereqStr.split('\n').map((s) => s.trim()).filter(Boolean),
      };

      if (editingListing) {
        await api.put(`/skills/${editingListing._id}`, payload);
      } else {
        await api.post('/skills', payload);
      }

      setIsModalOpen(false);
      loadListings();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save skill listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this skill listing?')) return;
    try {
      await api.delete(`/skills/${id}`);
      loadListings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link to="/provider/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Skill Listings</h1>
          <p className="text-xs text-slate-500 mt-1">Create, edit, and configure teaching offerings and credit rates.</p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Publish New Skill</span>
        </button>
      </div>

      {/* Listings Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <BookOpen size={36} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">You haven't published any skill listings yet</h3>
          <p className="text-xs text-slate-500">Publish your first offering to start receiving booking requests.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Create First Skill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item._id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {typeof item.category === 'object' ? item.category.name : 'Category'}
                  </span>
                  <CreditBadge amount={item.creditCost} size="sm" variant="subtle" />
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-2">{item.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {item.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star size={12} className="fill-amber-400" /> {item.rating.toFixed(1)} ({item.reviewCount})
                  </span>
                  <span>{item.totalBookings} taught</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(item)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="retro-card bg-stone-900 border-2 border-black max-w-xl w-full text-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-stone-950 border-b-2 border-black flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold font-retro text-amber-400 uppercase tracking-wider">
                  {editingListing ? '[UPDATE MISSION]' : '[FORGE NEW MISSION]'}
                </span>
                <h3 className="text-sm font-bold text-stone-100 mt-1 font-retro">
                  {editingListing ? 'EDIT SKILL OFFERING' : 'PUBLISH SKILL OFFERING'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 border border-stone-700 bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="retro-error-box p-3 border-2 border-red-600 bg-[#450a0a] text-xs text-red-200 font-mono">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                  SKILL TITLE
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Full-Stack Web Development with React & TypeScript"
                  className="retro-input w-full px-3.5 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                    CATEGORY
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                    DIFFICULTY LEVEL
                  </label>
                  <select
                    value={proficiencyLevel}
                    onChange={(e) => setProficiencyLevel(e.target.value)}
                    className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Credit Cost & Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                    COINS (5-200)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    required
                    value={creditCost}
                    onChange={(e) => setCreditCost(Number(e.target.value))}
                    className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                    TIME (MINS)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                    FORMAT
                  </label>
                  <select
                    value={sessionFormat}
                    onChange={(e) => setSessionFormat(e.target.value)}
                    className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                  >
                    <option value="1-on-1 Video">1-on-1 Video</option>
                    <option value="Hands-on Lab">Hands-on Lab</option>
                    <option value="Code Review">Code Review</option>
                    <option value="Consultation">Consultation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                  MISSION DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you teach? What hands-on exercises will you cover?"
                  className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                  LEARNING OUTCOMES (ONE PER LINE)
                </label>
                <textarea
                  rows={2}
                  value={outcomesStr}
                  onChange={(e) => setOutcomesStr(e.target.value)}
                  placeholder="Master React custom hooks&#10;Write clean API wrappers"
                  className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
                  TAGS (COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="React, TypeScript, Frontend, Node"
                  className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t-2 border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-stone-700 bg-stone-800 text-stone-300 text-xs font-bold font-retro text-[10px] hover:bg-stone-700 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs font-retro text-[10px] uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  {isSubmitting ? 'TRANSMITTING...' : editingListing ? 'UPDATE QUEST' : 'DEPLOY QUEST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};