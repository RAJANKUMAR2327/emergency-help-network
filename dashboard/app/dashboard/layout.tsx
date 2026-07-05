'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <div className="text-2xl mb-1">🆘</div>
          <h2 className="font-bold text-gray-900 text-sm">Emergency Help Network</h2>
          <p className="text-xs text-gray-500 mt-1">{user.role?.toUpperCase()} DASHBOARD</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm">
            📊 Overview
          </Link>
          <Link href="/dashboard/emergencies" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm">
            🚨 Live Emergencies
          </Link>
          <Link href="/dashboard/map" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm">
            🗺️ Live Map
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-sm">
            📈 Analytics
          </Link>
        </nav>
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 mb-2">{user.name}</div>
          <button onClick={logout} className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium">
            Logout →
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}