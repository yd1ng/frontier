import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    // 백엔드 서버 URL (Docker 환경에서는 nginx를 통해 프록시됨)
    const serverUrl = window.location.origin;

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnect attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTeamChat(recruitId: string) {
    if (this.socket) {
      this.socket.emit('join-team-chat', recruitId);
    }
  }

  leaveTeamChat(recruitId: string) {
    if (this.socket) {
      this.socket.emit('leave-team-chat', recruitId);
    }
  }

  onTeamMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('team-message', callback);
    }
  }

  offTeamMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('team-message', callback);
      } else {
        this.socket.off('team-message');
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

