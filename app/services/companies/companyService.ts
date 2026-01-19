import { CreateCompanyDTO, Company } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

        return response.json();
    },

    /**
     * Get all companies
     * GET /api/v1/companies
     */
    async getAllCompanies(): Promise<Company[]> {
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

        return response.json();
    }
};
