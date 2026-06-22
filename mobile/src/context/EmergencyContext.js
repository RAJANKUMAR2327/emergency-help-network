import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const EmergencyContext = createContext(null);

export const EmergencyProvider = ({ children }) => {
  const { token } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = io('https://ehn-api-proxy.rajankumar20030306.workers.dev', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('new_emergency', (data) => {
      setNearbyEmergencies((prev) => [data, ...prev.slice(0, 9)]);
    });
    socket.on('disconnect', () => console.log('Socket disconnected'));

    return () => socket.disconnect();
  }, [token]);

  const joinEmergencyRoom = (emergencyId) => {
    socketRef.current?.emit('join_emergency_room', emergencyId);
    socketRef.current?.on('responder_moved', (data) => {
      setResponders((prev) => {
        const existing = prev.findIndex((r) => r.userId === data.userId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });
    socketRef.current?.on('emergency_resolved', () => setActiveEmergency(null));
  };

  return (
    <EmergencyContext.Provider value={{ activeEmergency, setActiveEmergency, nearbyEmergencies, responders, joinEmergencyRoom }}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => useContext(EmergencyContext);
