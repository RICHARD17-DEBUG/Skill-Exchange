import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowLeft, Shield } from 'lucide-react';
import api from '../../api/client';
import { IUser } from '../../types';

export const AdminVerifications: React.FC = () => {
  const [providers, setProviders] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/users?role=provider');
      if (res.data.success) {
        setProviders(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
    const notes = prompt(`Notes for ${status}:`);
    try {
      const res = await api.put(`/admin/providers/${id}/verify`, { status, notes });
      if (res.data.success) {
        setActionMsg(`Provider marked as ${status}.`);
        loadProviders();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update provider status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Provider Verification Moderation</h1>
        <p className="text-xs text-slate-500 mt-1">Review applicant credentials and verify instructors to display official badges on their listings.</p>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-500 hover:text-emerald-700">âœ•</button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Provider</th>
                <th className="py-3 px-5">Headline & Experience</th>
                <th className="py-3 px-5">Verification Status</th>
                <th className="py-3 px-5 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">Loading provider applications...</td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">No providers registered yet.</td>
                </tr>
              ) : (
                providers.map((p) => {
                  const status = p.providerProfile?.verificationStatus || 'unverified';
                  return (
                    <tr key={p._id || p.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=6366f1&color=fff`}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{p.name}</p>
                            <p className="text-[11px] text-slate-400">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-800">{p.providerProfile?.headline || 'No headline set'}</p>
                        <p className="text-[11px] text-slate-500">{p.providerProfile?.yearsOfExperience || 0} Years Experience</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status !== 'verified' && (
                            <button
                              onClick={() => handleVerify(p._id || p.id, 'verified')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => handleVerify(p._id || p.id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};