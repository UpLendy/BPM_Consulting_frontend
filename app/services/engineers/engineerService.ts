import { CreateEngineerDTO, Engineer, AssignCompanyDTO } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const engineerService = {
    /**
     * Create an engineer record for a user
     * POST /api/v1/engineers
     */
    async createEngineer(data: CreateEngineerDTO): Promise<Engineer> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/engineers`, {
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
            throw new Error(errorData.message || 'Error al crear el perfil de ingeniero');
        }

        return response.json();
    },

    /**
     * Assign a company to an engineer
     * POST /api/v1/engineers/{id}/companies
     */
    async assignCompany(engineerId: string, data: AssignCompanyDTO): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/engineers/${engineerId}/companies`, {
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
            throw new Error(errorData.message || 'Error al asignar la empresa al ingeniero');
        }

        return response.json();
    },

    /**
     * Get engineer by userId
     * GET /api/v1/engineers/?is_active=true&userId={userId}
     */
    async getEngineerByUserId(userId: string): Promise<Engineer | null> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/engineers/?is_active=true&userId=${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        // Assuming it's an array and we want the first match
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }

        // If it's a single object
        if (data && data.userId === userId) {
            return data;
        }

        return null;
    },

    /**
     * Helper method to perform both steps: Create Engineer (if not exists) and Assign Company
     */
    async createAndAssign(userId: string, companyId: string): Promise<any> {
        let engineerId: string;

        // Check if engineer already exists
        const existingEngineer = await this.getEngineerByUserId(userId);

        if (existingEngineer) {
            engineerId = existingEngineer.id;
        } else {
            // Step 1: Create the engineer
            const newEngineer = await this.createEngineer({ userId });
            engineerId = newEngineer.id;
        }

        // Step 2: Assign the company using the engineer's id
        return await this.assignCompany(engineerId, { companyId });
    },

    /**
     * Get all active engineers
     * GET /api/v1/engineers/?is_active=true
     */
    async getAllEngineers(): Promise<Engineer[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/engineers/?is_active=true`, {
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
        return Array.isArray(data) ? data : [];
    },

    /**
     * Delete an engineer (Admin only) - Soft delete
     * DELETE /api/v1/engineers/{id}
     */
    async deleteEngineer(engineerId: string): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/engineers/${engineerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al eliminar el ingeniero');
        }

        return response.json();
    },

    /**
     * Get companies assigned to an engineer
     * GET /api/v1/engineers/{id}/companies
     */
    async getEngineerCompanies(engineerId: string): Promise<any[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/engineers/${engineerId}/companies`, {
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
    }
};
