import { create } from 'zustand';
import { authService, User } from '../services/auth.service';
import { socketService } from '../services/socket.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: !!authService.getToken(),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await authService.login({ email, password });
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      
      // Socket.io 연결
      const token = authService.getToken();
      if (token) {
        socketService.connect(token);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      await authService.register({ username, email, password });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    socketService.disconnect();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const user = authService.getStoredUser();
    const token = authService.getToken();
    set({ user, isAuthenticated: !!token });
    
    // 토큰이 있으면 Socket.io 연결
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }
  },
}));

