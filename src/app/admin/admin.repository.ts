import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';

@Service()
export class AdminRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async searchUsers(filters: { role?: string; name?: string; email?: string }): Promise<any[]> {
        const users: any[] = [];

        if (!filters.role || filters.role === 'patient') {
            let sql = `SELECT id as user_id, 'patient' as role, name, email FROM patients WHERE 1=1`;
            const params: any[] = [];

            if (filters.name) {
                sql += ' AND name LIKE ?';
                params.push(`%${filters.name}%`);
            }
            if (filters.email) {
                sql += ' AND email LIKE ?';
                params.push(`%${filters.email}%`);
            }

            const result = await this.databaseService.execQuery({ sql, params });
            users.push(...result.rows.map((row: any) => ({
                user_id: String(row.user_id),
                role: row.role,
                name: row.name,
                email: row.email,
            })));
        }

        if (!filters.role || filters.role === 'doctor') {
            let sql = `SELECT id as user_id, 'doctor' as role, name, email FROM doctors WHERE 1=1`;
            const params: any[] = [];

            if (filters.name) {
                sql += ' AND name LIKE ?';
                params.push(`%${filters.name}%`);
            }
            if (filters.email) {
                sql += ' AND email LIKE ?';
                params.push(`%${filters.email}%`);
            }

            const result = await this.databaseService.execQuery({ sql, params });
            users.push(...result.rows.map((row: any) => ({
                user_id: String(row.user_id),
                role: row.role,
                name: row.name,
                email: row.email,
            })));
        }

        return users;
    }

    async searchMedicalRecords(filters: { patient_id?: string; doctor_id?: string; from_date?: string; to_date?: string }): Promise<any[]> {
        let sql = 'SELECT id as record_id, patient_id, doctor_id, diagnosis, created_at FROM medical_records WHERE 1=1';
        const params: any[] = [];

        if (filters.patient_id) {
            sql += ' AND patient_id = ?';
            params.push(filters.patient_id);
        }
        if (filters.doctor_id) {
            sql += ' AND doctor_id = ?';
            params.push(filters.doctor_id);
        }
        if (filters.from_date) {
            sql += ' AND created_at >= ?';
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            sql += ' AND created_at <= ?';
            params.push(filters.to_date);
        }

        sql += ' ORDER BY created_at DESC';

        const result = await this.databaseService.execQuery({ sql, params });
        return result.rows.map((row: any) => ({
            record_id: String(row.record_id),
            patient_id: String(row.patient_id),
            doctor_id: String(row.doctor_id),
            diagnosis: row.diagnosis,
            created_at: row.created_at,
        }));
    }
}
