import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('nexus_token') || localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('nexus_user')) || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isPatient: (state) => state.user?.role === 'patient',
    isDoctor: (state) => state.user?.role === 'doctor',
    isAdmin: (state) => state.user?.role === 'admin',
    userName: (state) => state.user?.name || 'User',
    userEmail: (state) => state.user?.email || '',
    userPhone: (state) => state.user?.phone || state.user?.mobile || '',
  },

  actions: {
    setAuth(token, user) {
      this.token = token;
      this.user = user;
      
      // Persist to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('nexus_token', token);
      localStorage.setItem('nexus_user', JSON.stringify(user));
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
    },

    rehydrate() {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('nexus_user'));
      
      if (token && user) {
        this.token = token;
        this.user = user;
      }
    }
  }
});
