import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { IAvailabilitySlot } from '../../types';

export const ProviderAvailability: React.FC = () => {
  const [slots, setSlots] = useState<IAvailabilitySlot[]>([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/availability/my/slots');
      if (res.data.success) {
        setSlots(res.data.slots);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!date || !startTime || !endTime) {
      setErrorMsg('Please select a date, start time, and end time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/availability', { date, startTime, endTime });
      if (res.data.success) {
        setSuccessMsg('Availability slot added successfully.');
        loadSlots();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add availability slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await api.delete(`/availability/${id}`);
      loadSlots();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete slot.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link to="/provider/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Teaching Availability Calendar</h1>
        <p className="text-xs text-slate-500 mt-1">Publish open dates and time slots so learners can book 1-on-1 sessions with you.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="retro-error-box p-3.5 border-2 border-red-600 bg-[#450a0a] text-xs text-red-200 flex items-center gap-2 font-mono">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Slot Form Card */}
      <div className="retro-card bg-stone-900 border-2 border-black p-6 text-stone-100 space-y-4">
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-retro">[ADD TIME WINDOW]</h2>
        <form onSubmit={handleAddSlot} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              DATE
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              START TIME
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 font-retro text-[10px]">
              END TIME
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="retro-input w-full px-3 py-2 text-xs border-2 border-black focus:outline-none font-mono"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 border-2 border-black bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs font-retro text-[10px] uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'ADDING...' : 'ADD WINDOW'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Slots List */}
      <div className="retro-card bg-stone-900 border-2 border-black p-6 text-stone-100 space-y-4">
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-retro">
          ACTIVE TIME SLOTS ({slots.length})
        </h2>

        {isLoading ? (
          <p className="text-xs text-stone-400 py-6 text-center font-mono">SCANNING SCHEDULE...</p>
        ) : slots.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center font-mono">
            No availability slots configured yet. Broadcast your available hours above.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((s) => (
              <div
                key={s._id}
                className={`p-4 border-2 flex items-center justify-between text-xs transition-colors ${
                  s.isBooked
                    ? 'bg-stone-950 border-stone-800 text-stone-500'
                    : 'bg-stone-950 border-black text-stone-200 shadow-[2px_2px_0px_0px_#000]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-100 font-retro text-[10px]">
                    <Calendar size={13} className="text-amber-400" />
                    <span>{s.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
                    <Clock size={12} />
                    <span>{s.startTime} - {s.endTime}</span>
                  </div>
                  {s.isBooked ? (
                    <span className="inline-block px-2 py-0.5 border border-stone-700 text-[9px] font-bold font-retro bg-stone-800 text-stone-400">
                      CLAIMED
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 border border-emerald-700 text-[9px] font-bold font-retro bg-emerald-950 text-emerald-300">
                      OPEN QUEST
                    </span>
                  )}
                </div>

                {!s.isBooked && (
                  <button
                    onClick={() => handleDeleteSlot(s._id)}
                    className="p-1.5 border border-red-900 bg-red-950/60 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                    title="Remove slot"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};