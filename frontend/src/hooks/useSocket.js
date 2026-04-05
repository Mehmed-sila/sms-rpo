import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [newLog, setNewLog] = useState(null);
  const [smsUpdate, setSmsUpdate] = useState(null);

  useEffect(() => {
    const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
    socketRef.current = io(BACKEND || '/', { transports: ['websocket'] });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    // Yangi webhook keldi — raqamlar bilan
    socketRef.current.on('webhook:received', (data) => setNewLog(data));

    // SMS natijasi yangilandi
    socketRef.current.on('sms:updated', (data) => setSmsUpdate(data));

    return () => socketRef.current.disconnect();
  }, []);

  return { connected, newLog, smsUpdate };
}
