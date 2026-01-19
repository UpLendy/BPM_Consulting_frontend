import { UserRole } from './roles';

/**
 * Backend User structure (as received from API)
 */
export interface UserBackend {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    id_number: string;
    is_active: boolean;
    role: {
        id: string;
        name: string;
    };
    createdBy?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Frontend User (simplified for client-side use)
 */
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;        // firstName + lastName
    roleId: string;
    role: UserRole;          // Parsed role
    isActive: boolean;
    empresaId?: string;      // Only for empresarios
    ingenieroAsignado?: string; // Only for empresarios (references an engineer's ID)
}

/**
 * Helper function to convert backend user to frontend user
 */
export function mapBackendUserToUser(backendUser: UserBackend, role: UserRole, empresaId?: string, ingenieroAsignado?: string): User {
    return {
        id: backendUser.id,
        email: backendUser.email,
        firstName: backendUser.first_name,
        lastName: backendUser.last_name,
        fullName: `${backendUser.first_name} ${backendUser.last_name}`,
        roleId: backendUser.role.id,
        role,
        isActive: backendUser.is_active,
        empresaId,
        ingenieroAsignado
    };
}

/**
 * DTO for creating a new user
 */
export interface CreateUserDTO {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    id_number: string;
    roleId: string;
}
