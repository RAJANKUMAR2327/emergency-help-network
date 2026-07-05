'use client';
import { useState, useEffect } from 'react';
import { emergencyAPI } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useSocket } from '../../lib/useSocket';
import type { Emergency } from '../../lib/types';
import Link from 'next/link';

const typeColors: Record<string, string> = {
  medical: 'bg-red-100 text-red-800',
  accident: 'bg-orange-100 text-orange-800',
  fire: 'bg-yellow-100 text-yellow-800',
  crime: 'bg-purple-100 text-purple-800',
  natural_disaster: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800',
};

const typeIcons: Record<string, string> = {
  medical: '🚑', accident: '🚗', fire: '🔥', crime: '🚨', natural_disaster: '⚠️', other: '🆘',
};

export default function DashboardPage() {
  const { token } = useAuth();
  const { connected, newEmergency } = useSocket(token);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmergencies = async () => {
    try {
      const res = await emergencyAPI.getActive();
      setEmergencies(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount.
  useEffect(() => { fetchEmergencies(); }, []);

  useEffect(() => {
    if (newEmergency) {
      // This effect exists specifically to react to a socket push
      // (newEmergency changes when the server emits a new_emergency
      // event) and prepend it to the feed — the textbook "subscribe to
      // an external system, setState in a callback when it changes"
      // case the lint rule itself calls out as legitimate.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local list state with a socket.io push event, not derivable from render.
      setEmergencies((prev) => [newEmergency, ...prev]);
    }
  }, [newEmergency]);

  const active = emergencies.filter((e) => e.status === 'active').length;
  const responded = emergencies.filter((e) => e.status === 'responded').length;
  const medical = emergencies.filter((e) => e.type === 'medical').length;
  const critical = emergencies.filter((e) => e.severity === 'critical').length;

  const stats = [
    { label: 'Active Emergencies', value: active, color: 'bg-red-500', icon: '🚨' },
    { label: 'Being Responded', value: responded, color: 'bg-orange-500', icon: '🏃' },
    { label: 'Medical Cases', value: medical, color: 'bg-blue-500', icon: '🚑' },
    { label: 'Critical Severity', value: critical, color: 'bg-purple-500', icon: '⚠️' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time emergency monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className={`${s.color} text-white text-xl font-bold w-10 h-10 rounded-lg flex items-center justify-center`}>
                {s.value}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Live Emergency Feed</h2>
          <Link href="/dashboard/emergencies" className="text-red-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : emergencies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500">No active emergencies</p>
          </div>
        ) : (
          <div className="divide-y">
            {emergencies.slice(0, 8).map((e) => (
              <div key={e._id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <span className="text-2xl">{typeIcons[e.type] || '🆘'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[e.type] || 'bg-gray-100 text-gray-800'}`}>
                      {e.type?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{e.location?.address || 'Location not available'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Reporter: {e.reporter?.name || 'Unknown'} • {e.responders?.length || 0} responder(s)</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${e.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
