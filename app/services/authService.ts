import { LoginCredentials, LoginResponse } from '@/app/types/auth';
const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      throw new Error('Error en la autenticación');
    }
    return response.json();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  async getProfile(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    let data;
    if (!response.ok) {
      const res2 = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res2.ok) return null;
      data = await res2.json();
    } else {
      data = await response.json();
    }

    return data;
  },

  handleUnauthorized() {
    this.logout();
  }
};