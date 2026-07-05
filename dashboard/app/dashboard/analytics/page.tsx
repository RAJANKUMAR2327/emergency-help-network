'use client';
import { useState, useEffect } from 'react';
import { emergencyAPI } from '../../../lib/api';
import type { Emergency } from '../../../lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#7C3AED', '#0284C7', '#6B7280'];

export default function AnalyticsPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    emergencyAPI.getActive().then((res) => {
      setEmergencies(res.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const typeCounts = ['medical','accident','fire','crime','natural_disaster','other'].map((type) => ({
    name: type.replace('_',' '),
    count: emergencies.filter((e) => e.type === type).length,
  }));

  const severityCounts = ['critical','high','medium','low'].map((s) => ({
    name: s,
    value: emergencies.filter((e) => e.severity === s).length,
  })).filter((s) => s.value > 0);

  const statusCounts = [
    { name: 'Active', value: emergencies.filter((e) => e.status === 'active').length },
    { name: 'Responded', value: emergencies.filter((e) => e.status === 'responded').length },
    { name: 'Resolved', value: emergencies.filter((e) => e.status === 'resolved').length },
  ].filter((s) => s.value > 0);

  const withResponseTime = emergencies.filter((e) => e.responseTimeSeconds);
  const avgResponse = withResponseTime.length
    ? withResponseTime.reduce((acc, e) => acc + (e.responseTimeSeconds || 0), 0) / withResponseTime.length
    : 0;

  const kpis = [
    { label: 'Total Emergencies', value: emergencies.length, icon: '🆘' },
    { label: 'Avg Response Time', value: avgResponse ? Math.round(avgResponse) + 's' : 'N/A', icon: '⏱️' },
    { label: 'Resolution Rate', value: emergencies.length > 0 ? Math.round((emergencies.filter((e) => e.status === 'resolved').length / emergencies.length) * 100) + '%' : '0%', icon: '✅' },
    { label: 'Critical Cases', value: emergencies.filter((e) => e.severity === 'critical').length, icon: '🔴' },
  ];

  if (loading) return <div className="p-6 text-center text-gray-400 mt-20">Loading analytics...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
      <p className="text-gray-500 text-sm mb-6">Emergency response statistics and insights</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{k.value}</div>
            <div className="text-sm text-gray-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Emergencies by Type</h2>
          {emergencies.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#DC2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Severity Distribution</h2>
          {severityCounts.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={severityCounts} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => name + ' ' + ((percent ?? 0) * 100).toFixed(0) + '%'}>
                  {severityCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Status Breakdown</h2>
        {statusCounts.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet — trigger some test emergencies first</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusCounts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#0284C7" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
