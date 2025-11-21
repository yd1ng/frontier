import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private onConnectCallbacks: (() => void)[] = [];

  connect(token: string, onConnect?: () => void) {
    if (this.socket?.connected) {
      // 이미 연결되어 있으면 콜백 즉시 실행
      if (onConnect) {
        // 약간의 지연을 두어 리스너가 제대로 등록되도록 함
        setTimeout(() => {
          onConnect();
        }, 100);
      }
      return;
    }

    // 연결 완료 콜백 저장
    if (onConnect) {
      this.onConnectCallbacks.push(onConnect);
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
      // 연결 완료 콜백 실행
      this.onConnectCallbacks.forEach(callback => callback());
      this.onConnectCallbacks = [];
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      // 재연결 시 콜백 실행 (리스너 재등록)
      this.onConnectCallbacks.forEach(callback => callback());
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

  onRecruitApplication(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('recruit-application', callback);
    } else {
      // Socket이 아직 없으면 연결 후 등록
      console.warn('Socket not initialized, listener will be registered after connection');
    }
  }

  offRecruitApplication(callback?: (notification: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('recruit-application', callback);
      } else {
        this.socket.off('recruit-application');
      }
    }
  }

  onRecruitApproval(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('recruit-approval', callback);
    } else {
      // Socket이 아직 없으면 연결 후 등록
      console.warn('Socket not initialized, listener will be registered after connection');
    }
  }

  offRecruitApproval(callback?: (notification: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('recruit-approval', callback);
      } else {
        this.socket.off('recruit-approval');
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

