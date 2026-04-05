import { create } from 'zustand';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { cacheService } from '../services/cacheService';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT_AGENT';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

axios.defaults.withCredentials = true;

// Retrieve cached user data from localStorage
const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('auth_user');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

// Check for a persisted session to determine initial loading state
const hasSession = typeof window !== 'undefined' && localStorage.getItem('auth_session') === 'true';
const cachedUser = getCachedUser();
let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: cachedUser || null,
  // If a session exists, validate it before route decisions to prevent login flicker.
  loading: hasSession,
  initialized: !hasSession,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('auth_session', 'true');
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_session');
      localStorage.removeItem('auth_user');
    }
    set({ user });
  },
  checkAuth: async () => {
    if (checkAuthPromise) return checkAuthPromise;
    checkAuthPromise = (async () => {
      set({ loading: true });
      try {
        const res = await axios.get(API_ENDPOINTS.AUTH_ME, axiosConfig);
        if (res.data.user) {
          localStorage.setItem('auth_session', 'true');
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          set({ user: res.data.user, loading: false, initialized: true });
        } else {
          localStorage.removeItem('auth_session');
          localStorage.removeItem('auth_user');
          set({ user: null, loading: false, initialized: true });
        }
      } catch {
        localStorage.removeItem('auth_session');
        localStorage.removeItem('auth_user');
        set({ user: null, loading: false, initialized: true });
      } finally {
        checkAuthPromise = null;
      }
    })();

    try {
      await checkAuthPromise;
    } catch {
      // no-op: state handled above
    }
  },
  logout: async () => {
    try {
      await axios.post(API_ENDPOINTS.AUTH_LOGOUT, axiosConfig);
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      // Clear all caches on logout
      cacheService.clear();
      localStorage.removeItem('auth_session');
      localStorage.removeItem('auth_user');
      set({ user: null, initialized: true, loading: false });
    }
  }
}));
