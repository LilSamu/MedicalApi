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

    async findById(id: number): Promise<MedicalRecord | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM medical_records WHERE id = ?',
            params: [id],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as MedicalRecord;
    }

    async update(id: number, data: { diagnosis?: string; prescriptions?: string; notes?: string; test_results?: TestResult[]; treatments?: Treatment[] }): Promise<void> {
        const fields: string[] = [];
        const params: any[] = [];

        if (data.diagnosis !== undefined) {
            fields.push('diagnosis = ?');
            params.push(data.diagnosis);
        }
        if (data.prescriptions !== undefined) {
            fields.push('prescriptions = ?');
            params.push(data.prescriptions);
        }
        if (data.notes !== undefined) {
            fields.push('notes = ?');
            params.push(data.notes);
        }

        if (fields.length > 0) {
            params.push(id);
            await this.databaseService.execQuery({
                sql: `UPDATE medical_records SET ${fields.join(', ')} WHERE id = ?`,
                params,
            });
        }

        if (data.test_results) {
            await this.databaseService.execQuery({
                sql: 'DELETE FROM test_results WHERE record_id = ?',
                params: [id],
            });
            for (const test of data.test_results) {
                await this.databaseService.execQuery({
                    sql: 'INSERT INTO test_results (record_id, type, result) VALUES (?, ?, ?)',
                    params: [id, test.type, test.result],
                });
            }
        }

        if (data.treatments) {
            await this.databaseService.execQuery({
                sql: 'DELETE FROM treatments WHERE record_id = ?',
                params: [id],
            });
            for (const treatment of data.treatments) {
                await this.databaseService.execQuery({
                    sql: 'INSERT INTO treatments (record_id, description, start_date, end_date) VALUES (?, ?, ?, ?)',
                    params: [id, treatment.description, treatment.start_date, treatment.end_date],
                });
            }
        }
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
