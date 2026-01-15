import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';

@Service()
export class AuthRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async findPatientByEmail(email: string): Promise<any | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM patients WHERE email = ?',
            params: [email],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }

    async findDoctorByEmail(email: string): Promise<any | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM doctors WHERE email = ?',
            params: [email],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }

    async findAdminByUsername(username: string): Promise<any | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM admins WHERE username = ?',
            params: [username],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    }
}
