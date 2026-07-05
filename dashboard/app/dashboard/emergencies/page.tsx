'use client';
import { useState, useEffect } from 'react';
import { emergencyAPI } from '../../../lib/api';
import { useAuth } from '../../../lib/AuthContext';
import { useSocket } from '../../../lib/useSocket';
import { getErrorMessage, type Emergency } from '../../../lib/types';

const typeIcons: Record<string, string> = { medical: '🚑', accident: '🚗', fire: '🔥', crime: '🚨', natural_disaster: '⚠️', other: '🆘' };
const severityColors: Record<string, string> = { critical: 'bg-red-100 text-red-800 border-red-200', high: 'bg-orange-100 text-orange-800 border-orange-200', medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', low: 'bg-green-100 text-green-800 border-green-200' };

export default function EmergenciesPage() {
  const { token } = useAuth();
  const { newEmergency } = useSocket(token);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [selected, setSelected] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Declared above the effects that reference it (was below before —
  // functionally fine due to closures, but flagged by lint since the
  // effect calls it "before" it's declared in source order).
  const fetchEmergencies = async () => {
    try {
      const res = await emergencyAPI.getActive();
      setEmergencies(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Fetching data on mount and re-fetching when a socket event arrives are
  // both legitimate effect uses per React's own docs ("Effects let you
  // synchronize... external data source") — not derivable from render.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount.
  useEffect(() => { fetchEmergencies(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- re-fetch triggered by a socket push, not a render-derivable value.
  useEffect(() => { if (newEmergency) fetchEmergencies(); }, [newEmergency]);

  const handleResolve = async (id: string) => {
    if (!confirm('Mark this emergency as resolved?')) return;
    try {
      await emergencyAPI.resolve(id);
      fetchEmergencies();
      setSelected(null);
    } catch (e) { alert(getErrorMessage(e)); }
  };

  const handleAccept = async (id: string) => {
    try {
      await emergencyAPI.accept(id);
      fetchEmergencies();
      alert('You are now responding to this emergency');
    } catch (e) { alert(getErrorMessage(e)); }
  };

  const filtered = filter === 'all' ? emergencies : emergencies.filter((e) => e.type === filter || e.severity === filter || e.status === filter);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Emergencies</h1>
      <p className="text-gray-500 text-sm mb-6">Click any emergency to see full details and take action</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'active', 'responded', 'medical', 'accident', 'fire', 'crime', 'critical'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {loading ? <p className="text-gray-400 text-center py-8">Loading...</p> :
           filtered.length === 0 ? <div className="bg-white rounded-xl p-12 text-center"><div className="text-4xl mb-3">✅</div><p className="text-gray-500">No emergencies found</p></div> :
           filtered.map((e) => (
            <div key={e._id} onClick={() => setSelected(e)}
              className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer border-2 transition-all hover:shadow-md ${selected?._id === e._id ? 'border-red-400' : 'border-transparent'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcons[e.type] || '🆘'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{e.type?.replace('_',' ').toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[e.severity] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {e.severity?.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {e.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">📍 {e.location?.address || 'Unknown location'}</p>
                  <p className="text-xs text-gray-400 mt-1">👤 {e.reporter?.name} • {new Date(e.createdAt).toLocaleTimeString()} • {e.responders?.length || 0} helper(s)</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-6">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">{typeIcons[selected.type] || '🆘'}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.type?.replace('_',' ').toUpperCase()}</h2>
                  <p className="text-sm text-gray-500">ID: {selected._id?.slice(-8)}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Reporter</p>
                  <p className="font-medium text-gray-900">{selected.reporter?.name}</p>
                  <p className="text-sm text-gray-600">{selected.reporter?.phone}</p>
                  {selected.reporter?.bloodGroup && <p className="text-sm text-red-600 mt-1">🩸 Blood: {selected.reporter.bloodGroup}</p>}
                  {selected.reporter?.medicalInfo && <p className="text-sm text-gray-600 mt-1">ℹ️ {selected.reporter.medicalInfo}</p>}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Location</p>
                  <p className="text-sm text-gray-900">{selected.location?.address || 'Not available'}</p>
                  <a href={`https://maps.google.com/?q=${selected.location?.coordinates?.[1]},${selected.location?.coordinates?.[0]}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                    Open in Google Maps →
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Responders ({selected.responders?.length || 0})</p>
                  {selected.responders && selected.responders.length > 0 ? selected.responders.map((r, i) => (
                    <p key={i} className="text-sm text-gray-700">🏃 {typeof r.user === 'string' ? 'Helper' : r.user?.name || 'Helper'} — {r.status}</p>
                  )) : <p className="text-sm text-gray-400">No responders yet</p>}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Timeline</p>
                  {selected.timeline?.map((t, i) => (
                    <div key={i} className="flex gap-2 text-sm mb-1">
                      <span className="text-gray-400 text-xs">{new Date(t.timestamp).toLocaleTimeString()}</span>
                      <span className="text-gray-700">{t.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {selected.status === 'active' && (
                  <button onClick={() => handleAccept(selected._id)}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                    ✋ Respond
                  </button>
                )}
                <button onClick={() => handleResolve(selected._id)}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm">
                  ✅ Resolve
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-gray-500">Select an emergency to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
