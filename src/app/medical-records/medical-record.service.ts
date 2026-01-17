import { Service } from 'typedi';
import { MedicalRecordRepository } from './medical-record.repository';
import { MedicalRecord, TestResult, Treatment } from './medical-record.model';
import { NotificationRepository } from '../notifications/notification.repository';
import { AuditLogRepository } from '../audit-logs/audit-log.repository';

interface CreateRecordData {
    patient_id: string;
    doctor_id: string;
    diagnosis: string;
    prescriptions: string;
    notes: string;
    test_results?: TestResult[];
    treatments?: Treatment[];
}

interface UpdateRecordData {
    diagnosis?: string;
    prescriptions?: string;
    notes?: string;
    test_results?: TestResult[];
    treatments?: Treatment[];
}

@Service()
export class MedicalRecordService {
    constructor(
        private readonly repository: MedicalRecordRepository,
        private readonly notificationRepository: NotificationRepository,
        private readonly auditLogRepository: AuditLogRepository,
    ) { }

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

        await this.notificationRepository.create({
            user_id: parseInt(patient_id),
            type: 'medical_record_created',
            message: `A new medical record has been created for you`,
        });

        await this.auditLogRepository.create({
            user_id: String(requesterId),
            action: 'CREATE',
            resource_type: 'medical_record',
            resource_id: String(created.id),
            timestamp: new Date().toISOString(),
        });

        return {
            message: 'Record created',
            record_id: String(created.id),
        };
    }

    async update(recordId: number, data: UpdateRecordData, requesterId: number, requesterRole: string): Promise<{ message: string; record_id: string }> {
        if (requesterRole !== 'doctor') {
            throw new Error('Unauthorized');
        }

        const record = await this.repository.findById(recordId);
        if (!record) {
            throw new Error('NotFound');
        }

        if (record.doctor_id !== requesterId) {
            throw new Error('Forbidden');
        }

        if (!data.diagnosis && !data.prescriptions && !data.notes && !data.test_results && !data.treatments) {
            throw new Error('InvalidInput');
        }

        await this.repository.update(recordId, data);

        let notificationMessage = 'Your medical record has been updated';
        if (data.test_results && data.test_results.length > 0) {
            notificationMessage = 'New test results have been added to your medical record';
        }

        await this.notificationRepository.create({
            user_id: record.patient_id,
            type: 'medical_record_update',
            message: notificationMessage,
        });

        await this.auditLogRepository.create({
            user_id: String(requesterId),
            action: 'UPDATE',
            resource_type: 'medical_record',
            resource_id: String(recordId),
            timestamp: new Date().toISOString(),
        });

        return {
            message: 'Record updated',
            record_id: String(recordId),
        };
    }
}

