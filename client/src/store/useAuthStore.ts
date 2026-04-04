import { create } from 'zustand';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

axios.defaults.withCredentials = true;

// Check for a persisted session flag to avoid initial loading splash on every refresh
const hasSession = typeof window !== 'undefined' && localStorage.getItem('auth_session') === 'true';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: !hasSession, // If we think we have a session, don't show full loading splash immediately
  setUser: (user) => {
    if (user) localStorage.setItem('auth_session', 'true');
    else localStorage.removeItem('auth_session');
    set({ user });
  },
  checkAuth: async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AUTH_ME, axiosConfig);
      if (res.data.user) {
        localStorage.setItem('auth_session', 'true');
        set({ user: res.data.user, loading: false });
      } else {
        localStorage.removeItem('auth_session');
        set({ user: null, loading: false });
      }
    } catch {
      localStorage.removeItem('auth_session');
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    try {
      await axios.post(API_ENDPOINTS.AUTH_LOGOUT, axiosConfig);
      localStorage.removeItem('auth_session');
      set({ user: null });
    } catch (err) {
      console.error('Logout error', err);
    }
  }
}));
