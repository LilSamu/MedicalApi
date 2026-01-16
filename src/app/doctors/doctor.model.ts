export interface Doctor {
    id?: number;
    name: string;
    email: string;
    password: string;
    phone?: string;
    department_id?: number;
    location?: string;
    qualifications?: string;
}
