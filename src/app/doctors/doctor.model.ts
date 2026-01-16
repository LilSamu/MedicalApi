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

export interface AvailabilitySlot {
    id?: number;
    doctor_id: number;
    start_time: string;
    end_time: string;
    location?: string;
}
