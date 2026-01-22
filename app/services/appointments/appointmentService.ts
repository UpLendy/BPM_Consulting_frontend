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
     * Get a specific appointment by ID
     * GET /api/v1/appointments/{id}
     */
    async getAppointmentById(id: string): Promise<Appointment> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/${id}/`;

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
            throw new Error('Error al obtener los detalles de la cita');
        }

        return response.json();
    },

    /**
     * Get appointments for a specific engineer
     * GET /api/v1/appointments/engineer/{engineerId}
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
     * Get appointments for a specific company
     * GET /api/v1/appointments/company/{companyId}
     */
    async getAppointmentsByCompany(companyId: string): Promise<Appointment[]> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/company/${companyId}`;

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
     * Get the last completed appointment for a company
     * GET /api/v1/appointments/company/${companyId}/last
     */
    async getLastAppointmentByCompany(companyId: string): Promise<Appointment | null> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/company/${companyId}/last-completed`;

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
            return null;
        }

        return response.json();
    },

    /**
     * Get appointments for the assigned engineer of the logged-in company
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
    },

    /**
     * Confirm appointment
     */
    async confirmAppointment(id: string): Promise<Appointment> {
        const token = localStorage.getItem('token');

        const payload = {
            status: 'CONFIRMADA',
            engineerNotes: 'Asistencia confirmada por el ingeniero'
        };

        const response = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            throw new Error('Error al confirmar la cita');
        }

        return response.json();
    },

    /**
     * Start appointment
     */
    async startAppointment(id: string): Promise<Appointment> {
        const token = localStorage.getItem('token');

        const payload = {
            status: 'EN_PROGRESO',
            engineerNotes: 'Visita iniciada confirmada por el ingeniero'
        };

        const response = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            throw new Error('Error al iniciar la cita');
        }

        return response.json();
    },
    /**
     * Complete appointment
     */
    async completeAppointment(id: string): Promise<Appointment> {
        const token = localStorage.getItem('token');

        const payload = {
            status: 'COMPLETADA',
            engineerNotes: 'Visita finalizada y acta cargada'
        };

        const response = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            throw new Error('Error al finalizar la cita');
        }

        return response.json();
    },

    /**
     * Save visit registration record
     */
    async saveVisitRecord(id: string, recordData: any): Promise<any> {
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
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al guardar el registro de visita');
        }

        return response.json();
    },

    /**
     * Get visit evaluation (formData and successRate)
     */
    async getVisitEvaluation(id: string): Promise<any> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/${id}/evaluation/`;

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
            return null;
        }

        return response.json();
    },

    /**
     * Upload appointment record file (PDF)
     * POST /api/v1/appointments/{id}/record/upload
     */
    async uploadAppointmentRecord(id: string, file: Blob | File, fileName: string): Promise<any> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/${id}/record/upload/`;

        const formData = new FormData();
        // Explicitly include the filename in the append call for better backend compatibility
        formData.append('file', file, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
        formData.append('fileName', fileName);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Error al subir el acta');
        }

        return response.json();
    },

    /**
     * Sign appointment record (Finalize)
     * PATCH /api/v1/appointments/{id}/record/sign
     */
    async signAppointmentRecord(id: string, signatureData: any): Promise<any> {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/appointments/${id}/record/sign/`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ signature: signatureData })
        });

        if (!response.ok) {
            if (response.status === 401) {
                authService.handleUnauthorized();
            }
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Error al firmar el acta');
        }

        return response.json();
    }
};
