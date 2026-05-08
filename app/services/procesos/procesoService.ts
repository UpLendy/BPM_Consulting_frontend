import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateProcesoDTO {
  solicitudId: string;
  tramiteBaseId: string;
  codigo: string;
  llave: string;
  radicadoInicio: string;
  urlRadicado?: string;
  etapasIds: string[];
}

export const procesoService = {
  async createProceso(data: CreateProcesoDTO): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/procesos/`, {
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
      const detail = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData.errors || errorData);
      throw new Error(`Error ${response.status}: ${detail}`);
    }
    return response.json();
  },

  async getAllProcesos(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/procesos/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener los procesos');
    }
    return response.json();
  },

  async getProcesoBySolicitudId(solicitudId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/procesos/solicitud/${solicitudId}`, {
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

  async updateEtapaStatus(etapaId: string, estado: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/proceso-etapas/${etapaId}/estado`, {
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
      throw new Error(errorData.message || 'Error al actualizar el estado de la etapa');
    }
    return response.json();
  },

  async getEtapasByProcesoId(procesoId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/proceso-etapas/proceso/${procesoId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener las etapas del proceso');
    }
    return response.json();
  },

  async updateProcesoEstado(procesoId: string, estado: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/procesos/${procesoId}/estado`, {
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
      throw new Error(errorData.message || 'Error al actualizar el estado del proceso');
    }
    return response.json();
  },

  async updateProceso(procesoId: string, data: any): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/procesos/${procesoId}`, {
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
      throw new Error(errorData.message || 'Error al actualizar el proceso');
    }
    return response.json();
  }
};
