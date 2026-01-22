import { CreateAppointmentDTO, Appointment, AppointmentFilters, PaginatedResponse } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getErrorMessage(response: Response, defaultMessage: string): Promise<string> {
    if (response.status === 401) {
        authService.handleUnauthorized();
    }

    let message = defaultMessage;
    try {
        const responseForText = response.clone();
        const responseForJson = response.clone();

        try {
            const errorData = await responseForJson.json();
            message = errorData.message || errorData.error || errorData.detail ||
                (Array.isArray(errorData) ? errorData[0] : null) ||
                (typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
        } catch (e) {
            const text = await responseForText.text();
            if (text && text.length < 500) {
                message = text;
            }
        }
    } catch (error) {
        console.error('Error al procesar la respuesta del servidor:', error);
    }
    return message;
}

export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export const appointmentService = {
    /**
     * Create a new appointment
     */
    async createAppointment(data: CreateAppointmentDTO): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al crear la cita');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Get a specific appointment by ID
     */
    async getAppointmentById(id: string): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener los detalles de la cita');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Get appointments for a specific engineer
     */
    async getAppointmentsByEngineer(engineerId: string): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/engineer/${engineerId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return [];
        }

        const responseData = await response.json();
        return Array.isArray(responseData) ? responseData : (responseData.data || []);
    },

    /**
     * Get appointments for a specific company
     */
    async getAppointmentsByCompany(companyId: string): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/company/${companyId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return [];
        }

        const responseData = await response.json();
        return Array.isArray(responseData) ? responseData : (responseData.data || []);
    },

    /**
     * Get the last completed appointment for a company
     */
    async getLastAppointmentByCompany(companyId: string): Promise<Appointment | null> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/company/${companyId}/last-completed`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return null;
        }

        return response.json();
    },

    /**
     * Get appointments for the assigned engineer of the logged-in company
     */
    async getCompanyEngineerAppointments(): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/my-company/engineer-appointments`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return [];
        }

        const responseData = await response.json();
        return Array.isArray(responseData) ? responseData : (responseData.data || []);
    },

    /**
     * Get my appointments as representative
     */
    async getMyAppointments(page = 1, limit = 10): Promise<PaginatedResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/my-appointments?page=${Math.floor(page)}&limit=${Math.floor(limit)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
        }
        return response.json();
    },

    /**
     * Get all appointments (Admin)
     */
    async getAllAppointments(filters?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        params.append('is_active', 'true');

        if (filters) {
            if (filters.estado) params.append('status', filters.estado);
            if (filters.tipo) params.append('appointmentType', filters.tipo);
            if (filters.fechaInicio) params.append('dateFrom', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('dateTo', filters.fechaFin.toISOString());
            if (filters.page) params.append('page', Math.floor(filters.page).toString());
            if (filters.limit) params.append('limit', Math.floor(filters.limit).toString());
        }

        const response = await fetch(`${API_URL}/appointments/?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
        }
        return response.json();
    },

    /**
     * Confirm appointment
     */
    async confirmAppointment(id: string): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'CONFIRMADA', engineerNotes: 'Asistencia confirmada por el ingeniero' })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al confirmar la cita');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Start appointment
     */
    async startAppointment(id: string): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'EN_PROGRESO', engineerNotes: 'Visita iniciada confirmada por el ingeniero' })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al iniciar la cita');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Complete appointment
     */
    async completeAppointment(id: string): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'COMPLETADA', engineerNotes: 'Visita finalizada y acta cargada' })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al finalizar la cita');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Save visit registration record
     */
    async saveVisitRecord(id: string, recordData: any): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/evaluation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(recordData)
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al guardar el registro de visita');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Get visit evaluation
     */
    async getVisitEvaluation(id: string): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/evaluation/`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return null;
        return response.json();
    },

    /**
     * Upload appointment record file (PDF)
     */
    async uploadAppointmentRecord(id: string, file: Blob | File, fileName: string): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
        formData.append('fileName', fileName);

        const response = await fetch(`${API_URL}/appointments/${id}/record/upload/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al subir el acta');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Sign appointment record
     */
    async signAppointmentRecord(id: string, signatureData: any): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/record/sign/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ signature: signatureData })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al firmar el acta');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Create appointment validation
     */
    async createAppointmentValidation(id: string, notes = ''): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/validation/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notes })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al validar la cita');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    }
};
