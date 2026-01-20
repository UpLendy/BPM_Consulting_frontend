import { CreateUserDTO, User } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


// Simple Cache implementation using sessionStorage
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const USERS_CACHE_KEY = 'bpm_users_cache';
const ROLES_CACHE_KEY = 'bpm_roles_cache';

// Helper to get cache from sessionStorage
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

// Helper to set cache in sessionStorage
function setCache(key: string, data: any[]): void {
    if (typeof window === 'undefined') return;
    const cacheData = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(cacheData));
}

// Helper to clear cache
function clearCacheKey(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
}

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

        // Invalidate users cache on creation
        clearCacheKey(USERS_CACHE_KEY);
        console.log('🗑️ [CACHE] Caché de usuarios limpiado (nuevo usuario creado)');

        return response.json();
    },

    /**
     * Get all users (Admin only)
     * GET /api/v1/users
     */
    async getAllUsers(): Promise<any[]> {
        const now = Date.now();
        const cached = getCache(USERS_CACHE_KEY);

        if (cached && (now - cached.timestamp < CACHE_TTL)) {
            const remainingTime = Math.round((CACHE_TTL - (now - cached.timestamp)) / 1000 / 60);
            console.log(`✅ [CACHE] Usuarios cargados desde caché (válido por ${remainingTime} minutos más)`);
            return cached.data;
        }

        console.log('🔄 [API] Consultando usuarios desde el servidor...');
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

        const data = await response.json();
        setCache(USERS_CACHE_KEY, data);
        console.log(`💾 [CACHE] ${data.length} usuarios guardados en caché por 5 minutos`);
        return data;
    },

    /**
     * Get all roles (Used for the registration form)
     * GET /api/v1/roles
     */
    async getRoles(): Promise<any[]> {
        const now = Date.now();
        const cached = getCache(ROLES_CACHE_KEY);

        if (cached && (now - cached.timestamp < CACHE_TTL)) {
            const remainingTime = Math.round((CACHE_TTL - (now - cached.timestamp)) / 1000 / 60);
            console.log(`✅ [CACHE] Roles cargados desde caché (válido por ${remainingTime} minutos más)`);
            return cached.data;
        }

        console.log('🔄 [API] Consultando roles desde el servidor...');
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

        const data = await response.json();
        setCache(ROLES_CACHE_KEY, data);
        console.log(`💾 [CACHE] ${data.length} roles guardados en caché por 5 minutos`);
        return data;
    },

    /**
     * Force clear users cache
     */
    clearCache() {
        clearCacheKey(USERS_CACHE_KEY);
        clearCacheKey(ROLES_CACHE_KEY);
        console.log('🗑️ [CACHE] Todo el caché limpiado manualmente');
    }
};
