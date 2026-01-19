import { CreateUserDTO, User } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const userService = {
    /**
     * Create a new user (Admin only)
     * POST /api/v1/users
     */
    async createUser(data: CreateUserDTO): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al crear el usuario');
        }

        return response.json();
    },

    /**
     * Get all users (Admin only)
     * GET /api/v1/users
     */
    async getAllUsers(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            return [];
        }

        return response.json();
    },

    /**
     * Get all roles (Used for the registration form)
     * GET /api/v1/roles
     */
    async getRoles(): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/roles`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return [];
        }

        return response.json();
    }
};
