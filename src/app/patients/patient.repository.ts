import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { Patient } from './patient.model';

@Service()
export class PatientRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(patient: Patient): Promise<Patient> {
        await this.databaseService.execQuery({
            sql: 'INSERT INTO patients (name, email, password, phone, birth_date, address) VALUES (?, ?, ?, ?, ?, ?)',
            params: [patient.name, patient.email, patient.password, patient.phone, patient.birth_date, patient.address],
        });
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM patients WHERE email = ?',
            params: [patient.email],
        });
        return result.rows[0] as Patient;
    }

    async findByEmail(email: string): Promise<Patient | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM patients WHERE email = ?',
            params: [email],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as Patient;
    }

    async findById(id: number): Promise<Patient | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM patients WHERE id = ?',
            params: [id],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as Patient;
    }

    async update(id: number, data: { name?: string; phone?: string; address?: string }): Promise<Patient | null> {
        const fields: string[] = [];
        const params: any[] = [];

        if (data.name !== undefined) {
            fields.push('name = ?');
            params.push(data.name);
        }
        if (data.phone !== undefined) {
            fields.push('phone = ?');
            params.push(data.phone);
        }
        if (data.address !== undefined) {
            fields.push('address = ?');
            params.push(data.address);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        params.push(id);
        await this.databaseService.execQuery({
            sql: `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`,
            params,
        });

        return this.findById(id);
    }

    async getAppointments(patientId: number): Promise<any[]> {
        const result = await this.databaseService.execQuery({
            sql: `SELECT id as appointment_id, doctor_id, start_time, end_time, status 
                  FROM appointments WHERE patient_id = ? ORDER BY start_time`,
            params: [patientId],
        });
        return result.rows;
    }

    async getMedicalRecords(patientId: number): Promise<any[]> {
        const result = await this.databaseService.execQuery({
            sql: `SELECT id as record_id, doctor_id, diagnosis, prescriptions, notes 
                  FROM medical_records WHERE patient_id = ?`,
            params: [patientId],
        });

        for (const record of result.rows) {
            const testResults = await this.databaseService.execQuery({
                sql: 'SELECT type, result FROM test_results WHERE record_id = ?',
                params: [record.record_id],
            });
            record.test_results = testResults.rows;

            const treatments = await this.databaseService.execQuery({
                sql: 'SELECT description, start_date, end_date FROM treatments WHERE record_id = ?',
                params: [record.record_id],
            });
            record.treatments = treatments.rows;
        }

        return result.rows;
    }
}
