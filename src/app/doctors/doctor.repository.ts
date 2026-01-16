import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { Doctor } from './doctor.model';

@Service()
export class DoctorRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(doctor: Doctor): Promise<Doctor> {
        await this.databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, department_id, location, qualifications) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: [doctor.name, doctor.email, doctor.password, doctor.phone, doctor.department_id, doctor.location, doctor.qualifications],
        });
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM doctors WHERE email = ?',
            params: [doctor.email],
        });
        return result.rows[0] as Doctor;
    }

    async findByEmail(email: string): Promise<Doctor | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM doctors WHERE email = ?',
            params: [email],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as Doctor;
    }

    async findById(id: number): Promise<Doctor | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM doctors WHERE id = ?',
            params: [id],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as Doctor;
    }

    async update(id: number, data: { name?: string; phone?: string; location?: string }): Promise<Doctor | null> {
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
        if (data.location !== undefined) {
            fields.push('location = ?');
            params.push(data.location);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        params.push(id);
        await this.databaseService.execQuery({
            sql: `UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`,
            params,
        });

        return this.findById(id);
    }

    async addSpecialties(doctorId: number, specialtyIds: number[]): Promise<void> {

        await this.databaseService.execQuery({
            sql: 'DELETE FROM doctor_specialties WHERE doctor_id = ?',
            params: [doctorId],
        });

        for (const specialtyId of specialtyIds) {
            await this.databaseService.execQuery({
                sql: 'INSERT INTO doctor_specialties (doctor_id, specialty_id) VALUES (?, ?)',
                params: [doctorId, specialtyId],
            });
        }
    }

    async getSpecialties(doctorId: number): Promise<string[]> {
        const result = await this.databaseService.execQuery({
            sql: `SELECT s.name FROM specialties s 
                  JOIN doctor_specialties ds ON s.id = ds.specialty_id 
                  WHERE ds.doctor_id = ?`,
            params: [doctorId],
        });
        return result.rows.map((r: any) => r.name);
    }

    async searchDoctors(filters: { specialty_id?: string; date?: string; location?: string }): Promise<any[]> {
        let sql = `SELECT DISTINCT d.id as doctor_id, d.name, d.location FROM doctors d`;
        const params: any[] = [];
        const conditions: string[] = [];

        if (filters.specialty_id) {
            sql += ` JOIN doctor_specialties ds ON d.id = ds.doctor_id`;
            conditions.push('ds.specialty_id = ?');
            params.push(filters.specialty_id);
        }

        if (filters.location) {
            conditions.push('d.location LIKE ?');
            params.push(`%${filters.location}%`);
        }

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await this.databaseService.execQuery({ sql, params });

        for (const doctor of result.rows) {
            doctor.specialties = await this.getSpecialties(doctor.doctor_id);

            const slotResult = await this.databaseService.execQuery({
                sql: `SELECT start_time FROM availability_slots 
                      WHERE doctor_id = ? AND start_time > datetime('now') 
                      ORDER BY start_time LIMIT 1`,
                params: [doctor.doctor_id],
            });
            doctor.next_available_slot = slotResult.rows.length > 0 ? slotResult.rows[0].start_time : null;
        }

        return result.rows;
    }
}
