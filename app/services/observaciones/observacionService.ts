import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateObservacionDTO {
  procesoId: string;
  contenido: string;
}

export const observacionService = {
  async createObservacion(data: CreateObservacionDTO): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/observaciones/`, {
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
      throw new Error(errorData.message || 'Error al crear la observación');
    }
    return response.json();
  },

  async getObservacionesByProcesoId(procesoId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/observaciones/proceso/${procesoId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener el historial');
    }
    return response.json();
  }
};
