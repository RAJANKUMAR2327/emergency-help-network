'use client';
import { useState, useEffect } from 'react';
import { emergencyAPI } from '../../../lib/api';
import type { Emergency } from '../../../lib/types';

export default function MapPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);

  useEffect(() => {
    emergencyAPI.getActive().then((res) => setEmergencies(res.data.data || [])).catch(console.error);
    const interval = setInterval(() => {
      emergencyAPI.getActive().then((res) => setEmergencies(res.data.data || [])).catch(console.error);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const validEmergencies = emergencies.filter((e) => e.location?.coordinates?.[0] && e.location?.coordinates?.[1]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Map</h1>
      <p className="text-gray-500 text-sm mb-6">All active emergencies — refreshes every 10 seconds</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <iframe
          width="100%"
          height="500"
          style={{ border: 0 }}
          src={`https://maps.google.com/maps?q=25.5941,85.1376&z=12&output=embed`}
          allowFullScreen
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-gray-900 mb-3">Emergency Locations ({validEmergencies.length})</h2>
        <div className="space-y-2">
          {validEmergencies.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No active emergencies with location data</p>
          ) : validEmergencies.map((e) => (
            <div key={e._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">{e.type === 'medical' ? '🚑' : e.type === 'accident' ? '🚗' : e.type === 'fire' ? '🔥' : '🆘'}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{e.type?.toUpperCase()} — {e.reporter?.name}</p>
                <p className="text-xs text-gray-500">{e.location?.address || `${e.location?.coordinates?.[1].toFixed(4)}, ${e.location?.coordinates?.[0].toFixed(4)}`}</p>
              </div>
              <a href={`https://maps.google.com/?q=${e.location?.coordinates?.[1]},${e.location?.coordinates?.[0]}`}
                target="_blank" rel="noopener noreferrer"
                className="text-blue-600 text-xs hover:underline">
                Open →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
