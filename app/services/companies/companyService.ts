import { CreateCompanyDTO, Company } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


// Simple Cache implementation using sessionStorage
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const COMPANIES_CACHE_KEY = 'bpm_companies_cache';

// Helper to get cache from sessionStorage
function getCache(key: string): { data: Company[], timestamp: number } | null {
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
function setCache(key: string, data: Company[]): void {
    if (typeof window === 'undefined') return;
    const cacheData = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(cacheData));
}

// Helper to clear cache
function clearCacheKey(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
}

export const companyService = {
    /**
     * Create a new company (Admin only)
     * POST /api/v1/companies
     */
    async createCompany(data: CreateCompanyDTO): Promise<Company> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/companies`, {
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
            throw new Error(errorData.message || 'Error al crear la empresa');
        }

        // Invalidate companies cache on creation
        clearCacheKey(COMPANIES_CACHE_KEY);
        console.log('🗑️ [CACHE] Caché de empresas limpiado (nueva empresa creada)');

        return response.json();
    },

    /**
     * Get all companies
     * GET /api/v1/companies
     */
    async getAllCompanies(): Promise<Company[]> {
        const now = Date.now();
        const cached = getCache(COMPANIES_CACHE_KEY);

        if (cached && (now - cached.timestamp < CACHE_TTL)) {
            const remainingTime = Math.round((CACHE_TTL - (now - cached.timestamp)) / 1000 / 60);
            console.log(`✅ [CACHE] Empresas cargadas desde caché (válido por ${remainingTime} minutos más)`);
            return cached.data;
        }

        console.log('🔄 [API] Consultando empresas desde el servidor...');
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/companies`, {
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
        setCache(COMPANIES_CACHE_KEY, data);
        console.log(`💾 [CACHE] ${data.length} empresas guardadas en caché por 5 minutos`);
        return data;
    },

    /**
     * Force clear companies cache
     */
    clearCache() {
        clearCacheKey(COMPANIES_CACHE_KEY);
        console.log('🗑️ [CACHE] Caché de empresas limpiado manualmente');
    }
};
