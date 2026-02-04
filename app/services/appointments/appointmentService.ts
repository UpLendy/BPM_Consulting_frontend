import { CreateAppointmentDTO, Appointment, AppointmentFilters, PaginatedResponse, RescheduleAppointmentDTO } from '@/app/types';
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
     * Create a new appointment as an engineer
     */
    async createAppointmentByEngineer(data: CreateAppointmentDTO): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/by-engineer/`, {
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
    async getAppointmentsByEngineer(engineerId: string, filters?: AppointmentFilters): Promise<ServiceResponse<PaginatedResponse<Appointment>>> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters) {
            if (filters.page) params.append('page', Math.floor(filters.page).toString());
            if (filters.limit) params.append('limit', Math.floor(filters.limit).toString());
            if (filters.fechaInicio) params.append('date_from', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('date_to', filters.fechaFin.toISOString());
            if (filters.estado && (filters.estado as any) !== 'all') params.append('status', filters.estado);
        }

        const response = await fetch(`${API_URL}/appointments/engineer/${engineerId}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener las citas del ingeniero');
            return { success: false, error };
        }

        const responseData = await response.json();
        const paginatedData: PaginatedResponse<Appointment> = Array.isArray(responseData)
            ? { data: responseData, meta: { total: responseData.length, page: 1, limit: responseData.length || 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false } }
            : responseData;

        return { success: true, data: paginatedData };
    },

    /**
     * Get appointments for a specific company
     */
    async getAppointmentsByCompany(companyId: string, filters?: AppointmentFilters): Promise<ServiceResponse<PaginatedResponse<Appointment>>> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters) {
            if (filters.page) params.append('page', Math.floor(filters.page).toString());
            if (filters.limit) params.append('limit', Math.floor(filters.limit).toString());
            if (filters.fechaInicio) params.append('date_from', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('date_to', filters.fechaFin.toISOString());
        }

        const response = await fetch(`${API_URL}/appointments/company/${companyId}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener las citas de la empresa');
            return { success: false, error };
        }

        const responseData = await response.json();
        const paginatedData: PaginatedResponse<Appointment> = Array.isArray(responseData)
            ? { data: responseData, meta: { total: responseData.length, page: 1, limit: responseData.length || 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false } }
            : responseData;

        return { success: true, data: paginatedData };
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
    async getCompanyEngineerAppointments(filters?: AppointmentFilters): Promise<ServiceResponse<PaginatedResponse<Appointment>>> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters) {
            if (filters.page) params.append('page', Math.floor(filters.page).toString());
            if (filters.limit) params.append('limit', Math.floor(filters.limit).toString());
            if (filters.fechaInicio) params.append('date_from', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('date_to', filters.fechaFin.toISOString());
        }

        const response = await fetch(`${API_URL}/appointments/my-company/engineer-appointments?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener las citas');
            return { success: false, error };
        }

        const responseData = await response.json();
        const paginatedData: PaginatedResponse<Appointment> = Array.isArray(responseData)
            ? { data: responseData, meta: { total: responseData.length, page: 1, limit: responseData.length || 10, totalPages: 1, hasNextPage: false, hasPreviousPage: false } }
            : responseData;

        return { success: true, data: paginatedData };
    },

    /**
     * Get my appointments as representative
     */
    async getMyAppointments(filters?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> {
        const token = localStorage.getItem('token');

        const params = new URLSearchParams();

        // Only add pagination params if explicitly provided
        if (filters) {
            if (filters.page) params.append('page', Math.floor(filters.page).toString());
            if (filters.limit) params.append('limit', Math.floor(filters.limit).toString());
            if (filters.fechaInicio) params.append('date_from', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('date_to', filters.fechaFin.toISOString());
        }

        const response = await fetch(`${API_URL}/appointments/my-appointments?${params.toString()}`, {
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

        if (filters) {
            if (filters.estado && (filters.estado as any) !== 'all') params.append('status', filters.estado);
            if (filters.tipo && (filters.tipo as any) !== 'all') params.append('appointment_type', filters.tipo);
            if (filters.empresaId) params.append('company_id', filters.empresaId);
            if (filters.ingenieroId) params.append('engineer_id', filters.ingenieroId);

            if (filters.page) params.append('page', Math.floor(filters.page).toString());
            if (filters.limit) params.append('limit', Math.floor(filters.limit).toString());

            if (filters.fechaInicio) params.append('date_from', filters.fechaInicio.toISOString());
            if (filters.fechaFin) params.append('date_to', filters.fechaFin.toISOString());
        }

        const response = await fetch(`${API_URL}/appointments?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) authService.handleUnauthorized();
            return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
        }
        return response.json();
    },

    /**
     * Reschedule appointment
     */
    async rescheduleAppointment(id: string, data: RescheduleAppointmentDTO): Promise<ServiceResponse<Appointment>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/reschedule`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al reprogramar la cita');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
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
        const response = await fetch(`${API_URL}/appointments/${id}/evaluation`, {
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
     * Get record preview URL
     */
    async getAppointmentRecordPreview(id: string): Promise<ServiceResponse<{ url: string }>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/record/preview`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return { success: false, error: 'No se pudo obtener la previsualización del acta' };
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
    },

    /**
     * Get appointment validation details
     */
    async getAppointmentValidation(id: string): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/validation`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener la validación');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Upload validation document
     */
    async uploadValidationDocument(validationId: string, file: File, documentType = 'OTRO'): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        // displayName is optional and empty per requirements
        formData.append('displayName', '');

        // Note: The endpoint provided is post/api/v1/validations/{validationId}/documents/
        // Assuming API_URL is the base URL (e.g. http://localhost:8000/api/v1 or similar). 
        // If API_URL includes /api/v1, we just append /validations...
        // Based on existing code: `${API_URL}/appointments/...` checks out. 
        // We will assume validations is a sibling to appointments or similar path structure.
        // User specified: post/api/v1/validations/{validationId}/documents/
        // If API_URL is ".../api/v1", then we use `${API_URL}/validations/...`

        const response = await fetch(`${API_URL}/validations/${validationId}/documents/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al subir el documento');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Get all validations (Admin)
     */
    async getAllValidations(filters?: {
        page?: number;
        limit?: number;
        status?: string;
        is_active?: boolean;
        dateFrom?: string;
        dateTo?: string;
        orderBy?: string;
        orderDir?: string;
    }): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters) {
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());
            if (filters.status) params.append('status', filters.status);
            if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.orderBy) params.append('orderBy', filters.orderBy);
            if (filters.orderDir) params.append('orderDir', filters.orderDir);
        }

        const response = await fetch(`${API_URL}/validations/?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener las validaciones');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Update validation status
     */
    async updateValidationStatus(appointmentId: string, status: string): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${appointmentId}/validation/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: status,
                reviewNotes: "",
                rejectionReason: ""
            })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al actualizar el estado de la validación');
            return { success: false, error };
        }
        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Get documents for a validation (Re-added for Admin View)
     */
    async getValidationDocuments(validationId: string): Promise<ServiceResponse<any[]>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/validations/${validationId}/documents/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener documentos');
            return { success: false, error };
        }

        const result = await response.json();
        // Check for common array properties if result is an object
        const data = Array.isArray(result)
            ? result
            : (result.data || result.documents || result.files || []);
        return { success: true, data };
    },

    /**
     * Get document preview URL
     */
    async getDocumentPreview(validationId: string, documentId: string): Promise<ServiceResponse<{ url: string; fileName: string; mimeType: string; }>> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/validations/${validationId}/documents/${documentId}/preview`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al obtener previsualización');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Review a document (Approve/Reject)
     */
    async reviewDocument(
        validationId: string,
        documentId: string,
        data: { status: string; reviewNotes?: string; rejectionReason?: string }
    ): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/validations/${validationId}/documents/${documentId}/review`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: data.status,
                reviewNotes: data.reviewNotes || "",
                rejectionReason: data.rejectionReason || ""
            })
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al revisar el documento');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    async replaceDocument(validationId: string, documentId: string, file: File): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('displayName', file.name);
        formData.append('documentType', 'OTRO');

        const response = await fetch(`${API_URL}/validations/${validationId}/documents/${documentId}/replace`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al reemplazar el documento');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    },

    /**
     * Cancel an appointment
     */
    async cancelAppointment(id: string): Promise<ServiceResponse> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/appointments/${id}/cancel`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await getErrorMessage(response, 'Error al cancelar la cita');
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    }
};
