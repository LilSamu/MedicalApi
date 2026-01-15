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

    
}
