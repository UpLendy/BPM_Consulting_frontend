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
    }
};
