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

  async forgotPassword(email: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // We return the response even if not OK so the UI can handle the specific error message if needed,
    // or we can throw here. Usually better to check response.ok.
    // Given the previous pattern, let's throw if generic error but try to parse json for details if possible.
    if (!response.ok) {
      throw new Error('Error al solicitar recuperación de contraseña');
    }

    return response.json();
  },

  async resetPassword(data: any): Promise<any> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al restablecer la contraseña');
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