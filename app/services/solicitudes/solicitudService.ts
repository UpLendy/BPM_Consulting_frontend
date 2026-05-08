import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateSolicitudDTO {
  titulo: string;
  descripcion: string;
  fechaEntrada: string;
  fechaTerminacion?: string;
  idioma?: string;
  asignacion: string;
  grupo: string;
  observacion?: string;
  ingenieroId?: string;
  invimaComercialId?: string;
  invimaAdministrativoId?: string;
}

export const solicitudService = {
  async createSolicitud(data: CreateSolicitudDTO): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/solicitudes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear la solicitud');
    }
    return response.json();
  },

  async getAllSolicitudes(estado?: string): Promise<any> {
    const token = localStorage.getItem('token');
    const url = estado ? `${API_URL}/solicitudes/?estado=${estado}` : `${API_URL}/solicitudes/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener solicitudes');
    }
    return response.json();
  },

  async getSolicitudesByIngeniero(engineerId: string, estado?: string, soloConProceso?: boolean): Promise<any> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (soloConProceso !== undefined) params.append('soloConProceso', String(soloConProceso));

    const url = `${API_URL}/solicitudes/ingeniero/${engineerId}${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log(`[SolicitudService] Llamando a: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener solicitudes del ingeniero');
    }
    return response.json();
  },

  async updateSolicitud(id: string, data: Partial<CreateSolicitudDTO> & { estado?: string, is_active?: boolean }): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/solicitudes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar la solicitud');
    }
    return response.json();
  },

  async updateSolicitudEstado(id: string, estado: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/solicitudes/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el estado de la solicitud');
    }
    return response.json();
  }
};
