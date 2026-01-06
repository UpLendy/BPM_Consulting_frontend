import { CreateAppointmentDTO, Appointment } from '@/app/types';

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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al crear la cita');
        }

        return response.json();
    },

    /**
     * Get appointments for a specific engineer
     * GET /api/v1/appointments/engineer/{engineerId}
     */
    async getAppointmentsByEngineer(engineerId: string): Promise<Appointment[]> {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/appointments/engineer/${engineerId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener las citas');
        }

        return response.json();
    },

    /**
     * Get appointments for the assigned engineer of the logged-in company
     * GET /api/v1/appointments/my-company/engineer-appointments
     */
    async getCompanyEngineerAppointments(): Promise<Appointment[]> {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/appointments/my-company/engineer-appointments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener las citas del ingeniero asignado');
        }

        return response.json();
    },

    /**
     * Get appointments where the logged-in user is the representative
     * GET /api/v1/appointments/my-appointments
     */
    async getMyAppointments(): Promise<Appointment[]> {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/appointments/my-appointments`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch my appointments');
            return [];
        }

        return response.json();
    }
};
