import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../api/client';

const EmergencyContext = createContext(null);

export const EmergencyProvider = ({ children }) => {
  const { token } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Connect directly to Railway backend — Cloudflare Workers don't support
    // WebSocket upgrades without Durable Objects
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('new_emergency', (data) => {
      setNearbyEmergencies((prev) => [data, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinEmergencyRoom = (emergencyId) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_emergency_room', emergencyId);

    // Remove stale listeners before re-adding to prevent duplicates on re-navigation
    socket.off('responder_moved');
    socket.off('emergency_resolved');

    socket.on('responder_moved', (data) => {
      setResponders((prev) => {
        const idx = prev.findIndex((r) => r.userId === data.userId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    socket.on('emergency_resolved', () => {
      setActiveEmergency(null);
      setResponders([]);
    });
  };

  const leaveEmergencyRoom = (emergencyId) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('leave_emergency_room', emergencyId);
    socket.off('responder_moved');
    socket.off('emergency_resolved');
    setResponders([]);
  };

  return (
    <EmergencyContext.Provider value={{
      activeEmergency,
      setActiveEmergency,
      nearbyEmergencies,
      responders,
      joinEmergencyRoom,
      leaveEmergencyRoom,
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => useContext(EmergencyContext);
