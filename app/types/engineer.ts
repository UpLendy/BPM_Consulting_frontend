export interface Engineer {
    id: string;
    userId: string;
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
    companies: {
        id: string;
        name: string;
        nit: string;
    }[];
    is_active: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEngineerDTO {
    userId: string;
}

export interface AssignCompanyDTO {
    companyId: string;
}
