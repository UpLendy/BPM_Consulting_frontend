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
};