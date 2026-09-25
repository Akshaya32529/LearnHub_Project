import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,

  initializeAuth: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, loading: false, initialized: true, error: null });
      return response.data.user;
    } catch (error) {
      set({ user: null, loading: false, initialized: true, error: null });
      return null;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data;
      set({ user, loading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        ...userData,
        role: 'student',
      });
      const { user } = response.data;
      set({ user, loading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Registration failed';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue client logout even if the network request fails.
    }
    set({ user: null, error: null });
  },

}));
