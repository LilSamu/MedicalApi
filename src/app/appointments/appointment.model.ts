export interface Appointment {
    id?: number;
    patient_id: number;
    doctor_id: number;
    start_time: string;
    end_time: string;
    reason?: string;
    status: 'scheduled' | 'cancelled' | 'completed';
    cancellation_reason?: string;
}
