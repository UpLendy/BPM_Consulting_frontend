import { authService } from '@/app/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const invimaService = {
  async getCompanies(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invima-companies/`, {
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
    return response.json();
  },

  async getCompanyMembers(companyId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invima-companies/${companyId}/members`, {
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
    return response.json();
  },

  async createCompany(data: { nombre: string; is_active: boolean }): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invima-companies/`, {
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
      throw new Error(errorData.message || 'Error al crear la empresa INVIMA');
    }
    return response.json();
  },

  async getProfiles(): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invima-profiles/`, {
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
    return response.json();
  },

  async createProfile(data: { userId: string; tipo: string; invimaCompanyId: string }): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invima-profiles/`, {
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
      const detailedError = errorData.message || errorData.error || JSON.stringify(errorData);
      throw new Error(`Error al crear el perfil INVIMA: ${detailedError} (Payload enviado: ${JSON.stringify(data)})`);
    }
    return response.json();
  },

  async getProfileByUserId(userId: string): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/invima-profiles/user/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener el perfil INVIMA');
    }
    return response.json();
  },

  async uploadDocument(procesoEtapaId: string, data: { file: File; displayName: string; documentType: string }): Promise<any> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('displayName', data.displayName);
    formData.append('documentType', data.documentType);

    const response = await fetch(`${API_URL}/invima-documents/proceso-etapa/${procesoEtapaId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al subir el documento');
    }
    return response.json();
  },

  async replaceDocument(documentId: string, data: { file: File; displayName: string; documentType: string; etapaId?: string; procesoEtapaId?: string }): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const formData = new FormData();
    formData.append('file', data.file);
    if (data.displayName) formData.append('displayName', data.displayName);
    if (data.documentType) formData.append('documentType', data.documentType);

    const response = await fetch(`${API_URL}/invima-documents/${documentId}/replace`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      const detailedMessage = errorData.message ? (Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message) : 'Error al reemplazar el documento';
      throw new Error(detailedMessage);
    }
    return response.json();
  },

  async updateDocumentStatus(documentId: string, status: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/invima-documents/${documentId}/review`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el estado del documento');
    }
    return response.json();
  },

  async getDocumentPreview(documentId: string): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/invima-documents/${documentId}/preview`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) authService.handleUnauthorized();
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener la previsualización');
    }
    return response.json();
  }
};
