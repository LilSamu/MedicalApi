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

    
}
