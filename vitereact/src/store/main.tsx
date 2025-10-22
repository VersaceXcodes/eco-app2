import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthState {
  currentUser: User | null;
  authToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

interface AppState {
  authentication_state: AuthState;
  current_user_id: string | null;
  current_challenge_id: string | null;
  current_location: string | null;
}

// Store Implementation
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      authentication_state: {
        currentUser: null,
        authToken: null,
        isAuthenticated: false,
        login: async (credentials) => {
          try {
            const { data: { user, token } } = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
              credentials
            );
            set((state) => ({
              authentication_state: {
                currentUser: user,
                authToken: token,
                isAuthenticated: true,
                login: state.authentication_state.login,
                logout: state.authentication_state.logout,
                checkAuth: state.authentication_state.checkAuth,
              },
            }));
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed';
            set((state) => ({
              authentication_state: {
                ...state.authentication_state,
                isAuthenticated: false,
                error_message: errorMessage,
              },
            }));
            throw new Error(errorMessage);
          }
        },
        logout: () => {
          set((state) => ({
            authentication_state: {
              currentUser: null,
              authToken: null,
              isAuthenticated: false,
            },
          }));
        },
        checkAuth: async () => {
          const token = get().authentication_state.authToken;
          if (!token) return;
          try {
            const { data: { user } } = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            set((state) => ({
              authentication_state: {
                currentUser: user,
                authToken: token,
                isAuthenticated: true,
              },
            }));
          } catch {
            set((state) => ({
              authentication_state: {
                currentUser: null,
                authToken: null,
                isAuthenticated: false,
              },
            }));
          }
        },
      },
      {
        name: 'app-auth-storage',
        partialize: (state) => ({
          authentication_state: {
            currentUser: state.authentication_state.currentUser,
            authToken: state.authentication_state.authToken,
          },
        }),
      },
    })
  )
);