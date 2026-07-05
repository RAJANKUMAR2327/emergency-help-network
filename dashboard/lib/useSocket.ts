import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Emergency } from './types';

// This was hardcoded to your old Railway URL
// (emergency-help-network-production.up.railway.app), which you migrated
// away from. Live socket updates on the dashboard have been silently
// broken since that migration. Now reads from env with your current
// Render URL as the fallback.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://emergency-help-network.onrender.com';

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [newEmergency, setNewEmergency] = useState<Emergency | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('new_emergency', (data: Emergency) => setNewEmergency(data));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Note: the raw socket instance is intentionally not returned here.
  // Reading a ref's .current during render (rather than inside an effect
  // or event handler) is unsafe with concurrent rendering, and no page
  // in this app was actually consuming it — only `connected` and
  // `newEmergency` (both reactive state) are used anywhere.
  return { connected, newEmergency };
};
