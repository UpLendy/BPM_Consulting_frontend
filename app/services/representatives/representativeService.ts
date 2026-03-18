import { CreateRepresentativeDTO, Representative } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const representativeService = {
    /**
     * Create a representative record for a user
     * POST /api/v1/representatives
     */
    async createRepresentative(data: CreateRepresentativeDTO): Promise<Representative> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/representatives`, {
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
            throw new Error(errorData.message || 'Error al crear el perfil de representante');
        }

        return response.json();
    },

    /**
     * Get representative by userId
     * GET /api/v1/representatives/?is_active=true&userId={userId}
     */
    async getRepresentativeByUserId(userId: string): Promise<Representative | null> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/representatives/?is_active=true&userId=${userId}`, {
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
     * Helper method to check if representative exists, if not create it
     * IMPORTANT: A representative can only be assigned to ONE company (1:1 relationship)
     */
    async ensureRepresentative(userId: string, phoneNumber: string, companyId?: string): Promise<Representative> {
        // Check if representative already exists
        const existingRep = await this.getRepresentativeByUserId(userId);

        if (existingRep) {
            // Representative already exists

            // Validate if trying to change company (not allowed - 1:1 relationship)
            if (companyId && existingRep.companyId && existingRep.companyId !== companyId) {
                throw new Error(
                    `Este representante ya está asignado a la empresa "${existingRep.company?.name || 'otra empresa'}.`
                );
            }

            // If trying to assign to the same company or no company specified, return existing
            if (!companyId || existingRep.companyId === companyId) {
                return existingRep;
            }
        }

        // Create new representative
        return await this.createRepresentative({
            userId,
            phone_number: phoneNumber,
            companyId
        });
    },

    /**
     * Get all active representatives
     * GET /api/v1/representatives/?is_active=true
     */
    async getAllRepresentatives(): Promise<Representative[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/representatives/?is_active=true`, {
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

    async getRepresentativeSignature(id: string): Promise<{ signatureUrl: string; updatedAt?: string } | null> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/representatives/${id}/signature`, {
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
        return {
            signatureUrl: data.signatureUrl,
            updatedAt: data.signatureUploadedAt || data.updatedAt
        };
    },

    /**
     * Update representative signature
     * POST /api/v1/representatives/{id}/signature
     */
    async updateRepresentativeSignature(id: string, signatureBase64: string): Promise<any> {
        const token = localStorage.getItem('token');
        
        // Convert base64 data URL to a Blob
        const res = await fetch(signatureBase64);
        const blob = await res.blob();
        
        // Create FormData matching the backend requirement: { "file": binary }
        const formData = new FormData();
        formData.append('file', blob, 'signature.png');

        const response = await fetch(`${API_URL}/representatives/${id}/signature`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Content-Type is handled automatically by the browser for FormData
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al actualizar la firma del representante');
        }

        return await response.json();
    }
};
