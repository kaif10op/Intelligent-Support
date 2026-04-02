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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  checkAuth: async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AUTH_ME, axiosConfig);
      set({ user: res.data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    try {
      await axios.post(API_ENDPOINTS.AUTH_LOGOUT, axiosConfig);
      set({ user: null });
    } catch (err) {
      console.error('Logout error', err);
    }
  }
}));
