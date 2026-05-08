import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const tramiteService = {
  async getSimpleList(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tramites/simple-list`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener trámites');
    }
    return response.json();
  },

  async getEtapasBaseByTramite(tramiteId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tramite-etapas-base/tramite/${tramiteId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener las etapas del trámite');
    }
    return response.json();
  }
};
