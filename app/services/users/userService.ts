import { CreateUserDTO, UpdateUserDTO } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Simple Cache implementation using sessionStorage
const CACHE_TTL = 5 * 60 * 1000;
const USERS_CACHE_KEY = 'bpm_users_cache';
const ROLES_CACHE_KEY = 'bpm_roles_cache';

function getCache(key: string): { data: any[], timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    try {
        return JSON.parse(cached);
    } catch {
        return null;
    }
}

function setCache(key: string, data: any[]): void {
    if (typeof window === 'undefined') return;
    const cacheData = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(cacheData));
}

function clearCacheKey(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
}

export const userService = {
    async createUser(data: CreateUserDTO): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al crear el usuario');
        }
        clearCacheKey(USERS_CACHE_KEY);
        return response.json();
    },

    async updateUser(userId: string, data: UpdateUserDTO): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al actualizar el usuario');
        }
        clearCacheKey(USERS_CACHE_KEY);
        return response.json();
    },

    async deleteUser(userId: string): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al eliminar el usuario');
        }
        clearCacheKey(USERS_CACHE_KEY);
        return response.json();
    },

    /**
     * Obtenemos todos los usuarios sin paginación de backend para manejarla en el frontend
     * ya que el endpoint /users/ parece no soportar ?page y ?limit correctamente por ahora.
     */
    async getAllUsers(filters?: { page?: number; limit?: number }): Promise<any> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        const url = `${API_URL}/users/?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) authService.handleUnauthorized();
                return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching users:", error);
            return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
    },

    async getRoles(): Promise<any[]> {
        const now = Date.now();
        const cached = getCache(ROLES_CACHE_KEY);
        if (cached && (now - cached.timestamp < CACHE_TTL)) return cached.data;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/roles`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return [];
        const data = await response.json();
        setCache(ROLES_CACHE_KEY, data);
        return data;
    },

    clearCache() {
        clearCacheKey(USERS_CACHE_KEY);
        clearCacheKey(ROLES_CACHE_KEY);
    }
};
