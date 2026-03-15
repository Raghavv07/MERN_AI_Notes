import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        set({ user: response.user, isAuthenticated: true });
      },

      register: async (fullName: string, email: string, password: string) => {
        const response = await authApi.register({ fullName, email, password });
        set({ user: response.user, isAuthenticated: true });
      },

      logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const response = await authApi.getMe();
          set({ user: response.user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);
