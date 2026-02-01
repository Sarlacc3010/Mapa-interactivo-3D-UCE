// FIX: Import from 'zustand/react' to avoid Vite dependency optimization errors in Docker
import { create } from 'zustand/react';

// Store definition for global authentication state
export const useAuthStore = create((set) => ({
  user: null, 
  isAuthenticated: false,
  isLoading: true, 

  // Action: Set user data upon successful login
  login: (userData) => set({ 
    user: userData, 
    isAuthenticated: true, 
    isLoading: false 
  }),

  // Action: Clear user data upon logout
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isLoading: false 
  }),

  // Action: Manually set loading state
  setLoading: (status) => set({ isLoading: status }),

  // Action: Update profile locally
  updateProfile: (updatedData) => set((state) => ({
    user: { ...state.user, ...updatedData }
  }))
}));