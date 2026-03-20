import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

let socket: Socket | null = null;

export const useSyncSocket = (onTradeSynced?: () => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    if (!socket) {
      socket = io(apiUrl);
    }

    // Join user-specific room
    socket.emit('join_user', user.id);

    // Listen for sync events
    socket.on('trade_synced', (data: any) => {
      console.log('Real-time sync received:', data);
      toast.success('MT5 Sync: New trade added!', {
        description: `${data.trade.pair} ${data.trade.direction} at ${data.trade.entry}`,
      });
      
      if (onTradeSynced) {
        onTradeSynced();
      }
    });

    return () => {
      if (socket) {
        socket.off('trade_synced');
      }
    };
  }, [user?.id, onTradeSynced]);

  return socket;
};
