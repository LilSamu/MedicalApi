import { Service } from 'typedi';
import { MedicalRecordRepository } from './medical-record.repository';
import { MedicalRecord, TestResult, Treatment } from './medical-record.model';

interface CreateRecordData {
    patient_id: string;
    doctor_id: string;
    diagnosis: string;
    prescriptions: string;
    notes: string;
    test_results?: TestResult[];
    treatments?: Treatment[];
}

@Service()
export class MedicalRecordService {
    constructor(private readonly repository: MedicalRecordRepository) { }

    async create(data: CreateRecordData, requesterId: number, requesterRole: string): Promise<{ message: string; record_id: string }> {
        if (requesterRole !== 'doctor') {
            throw new Error('Unauthorized');
        }

        const { patient_id, doctor_id, diagnosis, prescriptions, notes } = data;

        if (!patient_id || !doctor_id || !diagnosis) {
            throw new Error('InvalidInput');
        }

        const doctorId = parseInt(doctor_id);

        if (doctorId !== requesterId) {
            throw new Error('Unauthorized');
        }

        const patientExists = await this.repository.patientExists(parseInt(patient_id));
        const doctorExists = await this.repository.doctorExists(doctorId);

        if (!patientExists || !doctorExists) {
            throw new Error('NotFound');
        }

        const record: MedicalRecord = {
            patient_id: parseInt(patient_id),
            doctor_id: doctorId,
            diagnosis,
            prescriptions,
            notes,
            test_results: data.test_results,
            treatments: data.treatments,
        };

        const created = await this.repository.create(record);

        return {
            message: 'Record created',
            record_id: String(created.id),
        };
    }
}
