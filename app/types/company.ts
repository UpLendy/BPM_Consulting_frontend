/**
 * DTO for creating a new company
 */
export interface CreateCompanyDTO {
    name: string;
    nit: string;
    address?: string;
}

/**
 * Company interface
 */
export interface Company {
    id: string;
    name: string;
    nit: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}
