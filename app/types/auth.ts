export interface LoginCredentials {
  email: string;
  password: string;
}

// Backend response structure
export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'engineer' | 'company';
    engineerId?: string;
  };
}

// Backend to Frontend role mapping
export type BackendRole = 'admin' | 'engineer' | 'company';

export function mapBackendRoleToFrontend(backendRole: any): 'admin' | 'ingeniero' | 'empresario' {
  const roleName = (backendRole?.name || backendRole || '').toLowerCase();
  
  if (roleName === 'admin' || roleName === 'administrador') return 'admin';
  if (roleName === 'engineer' || roleName === 'ingeniero') return 'ingeniero';
  if (roleName === 'company' || roleName === 'empresa' || roleName === 'empresario' || roleName === 'representative') return 'empresario';
  
  return 'admin'; // fallback
}