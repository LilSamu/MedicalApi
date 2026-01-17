export interface TestResult {
    id?: number;
    record_id?: number;
    type: string;
    result: string;
}

export interface Treatment {
    id?: number;
    record_id?: number;
    description: string;
    start_date: string;
    end_date: string;
}

export interface MedicalRecord {
    id?: number;
    patient_id: number;
    doctor_id: number;
    diagnosis: string;
    prescriptions: string;
    notes: string;
    created_at?: string;
    test_results?: TestResult[];
    treatments?: Treatment[];
}
