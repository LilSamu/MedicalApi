import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { MedicalRecord, TestResult, Treatment } from './medical-record.model';

@Service()
export class MedicalRecordRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(record: MedicalRecord): Promise<MedicalRecord> {
        await this.databaseService.execQuery({
            sql: `INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescriptions, notes) 
                  VALUES (?, ?, ?, ?, ?)`,
            params: [record.patient_id, record.doctor_id, record.diagnosis, record.prescriptions, record.notes],
        });

        const recordResult = await this.databaseService.execQuery({
            sql: 'SELECT * FROM medical_records ORDER BY id DESC LIMIT 1',
            params: [],
        });
        const createdRecord = recordResult.rows[0] as MedicalRecord;
        const recordId = createdRecord.id!;

        if (record.test_results && record.test_results.length > 0) {
            for (const test of record.test_results) {
                await this.databaseService.execQuery({
                    sql: 'INSERT INTO test_results (record_id, type, result) VALUES (?, ?, ?)',
                    params: [recordId, test.type, test.result],
                });
            }
        }

        if (record.treatments && record.treatments.length > 0) {
            for (const treatment of record.treatments) {
                await this.databaseService.execQuery({
                    sql: 'INSERT INTO treatments (record_id, description, start_date, end_date) VALUES (?, ?, ?, ?)',
                    params: [recordId, treatment.description, treatment.start_date, treatment.end_date],
                });
            }
        }

        return createdRecord;
    }

    async patientExists(patientId: number): Promise<boolean> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT id FROM patients WHERE id = ?',
            params: [patientId],
        });
        return result.rows.length > 0;
    }

    async doctorExists(doctorId: number): Promise<boolean> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT id FROM doctors WHERE id = ?',
            params: [doctorId],
        });
        return result.rows.length > 0;
    }
}
