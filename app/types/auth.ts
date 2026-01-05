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
  };
}

// Backend to Frontend role mapping
export type BackendRole = 'admin' | 'engineer' | 'company';

export function mapBackendRoleToFrontend(backendRole: BackendRole): 'admin' | 'ingeniero' | 'empresario' {
  const roleMap: Record<BackendRole, 'admin' | 'ingeniero' | 'empresario'> = {
    admin: 'admin',
    engineer: 'ingeniero',
    company: 'empresario'
  };
  return roleMap[backendRole];
}