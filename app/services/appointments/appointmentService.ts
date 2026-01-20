import { CreateAppointmentDTO, Appointment, AppointmentFilters } from '@/app/types';
import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const appointmentService = {
    /**
     * Create a new appointment
     * POST /api/v1/appointments/
     */
    async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
        const token = localStorage.getItem('token');

        // Construct payload strictly matching the backend requirement
        const payload = {
            description: data.description,
            appointmentType: data.appointmentType,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location
        };

        const response = await fetch(`${API_URL}/appointments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al crear la cita');
        }

        return response.json();
    },

    /**
     * Get appointments for a specific engineer
     * GET /api/v1/appointments/engineer/{engineerId}
     * (Admin or the Engineer themselves)
     */
    async getAppointmentsByEngineer(engineerId: string): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/engineer/${engineerId}`;

        const response = await fetch(url, {
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
     * Get appointments for the assigned engineer of the logged-in company
     * GET /api/v1/appointments/my-company/engineer-appointments
     * (Admin or Company)
     */
    async getCompanyEngineerAppointments(): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/my-company/engineer-appointments`;

        const response = await fetch(url, {
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
            throw new Error('Error al obtener las citas del ingeniero asignado');
        }

        return response.json();
    },

    /**
     * Get my appointments as representative (Solo Companies)
     * GET /api/v1/appointments/my-appointments
     */
    async getMyAppointments(): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/my-appointments`;

        const response = await fetch(url, {
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
     * Get all appointments (Admin) with optional filters
     * GET /api/v1/appointments/?is_active=true&...
     */
    async getAllAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        params.append('is_active', 'true');

        if (filters) {
            if (filters.estado) params.append('status', filters.estado);
            if (filters.tipo) params.append('appointmentType', filters.tipo);
            if (filters.fechaInicio) params.append('dateFrom', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('dateTo', filters.fechaFin.toISOString());
        }

        const response = await fetch(`${API_URL}/appointments/?${params.toString()}`, {
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
