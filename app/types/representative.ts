export interface Representative {
    id: string;
    userId: string;
    phone_number: string;
    companyId?: string;
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        id_number: string;
        id_type: string;
        role: {
            id: string;
            name: string;
        };
    };
    company?: {
        id: string;
        name: string;
        nit: string;
    };
    is_active: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRepresentativeDTO {
    userId: string;
    phone_number: string;
    companyId?: string;
}
