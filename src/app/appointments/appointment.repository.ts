import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { Appointment } from './appointment.model';

@Service()
export class AppointmentRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(appointment: Appointment): Promise<Appointment> {
        await this.databaseService.execQuery({
            sql: `INSERT INTO appointments (patient_id, doctor_id, start_time, end_time, reason, status) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            params: [appointment.patient_id, appointment.doctor_id, appointment.start_time,
            appointment.end_time, appointment.reason, 'scheduled'],
        });
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM appointments ORDER BY id DESC LIMIT 1',
            params: [],
        });
        return result.rows[0] as Appointment;
    }

    async findById(id: number): Promise<Appointment | null> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM appointments WHERE id = ?',
            params: [id],
        });
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0] as Appointment;
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

    async isDoctorAvailable(doctorId: number, startTime: string, endTime: string): Promise<boolean> {
        const result = await this.databaseService.execQuery({
            sql: `SELECT id FROM availability_slots 
                  WHERE doctor_id = ? AND start_time <= ? AND end_time >= ?`,
            params: [doctorId, startTime, endTime],
        });
        return result.rows.length > 0;
    }

    async hasConflictingAppointment(doctorId: number, startTime: string, endTime: string, excludeId?: number): Promise<boolean> {
        let sql = `SELECT id FROM appointments 
                   WHERE doctor_id = ? AND status = 'scheduled'
                   AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))`;
        const params: any[] = [doctorId, startTime, startTime, endTime, endTime, startTime, endTime];

        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        const result = await this.databaseService.execQuery({ sql, params });
        return result.rows.length > 0;
    }

    async cancel(id: number, reason: string): Promise<void> {
        await this.databaseService.execQuery({
            sql: `UPDATE appointments SET status = 'cancelled', cancellation_reason = ? WHERE id = ?`,
            params: [reason, id],
        });
    }

    async reschedule(id: number, newStartTime: string, newEndTime: string): Promise<void> {
        await this.databaseService.execQuery({
            sql: `UPDATE appointments SET start_time = ?, end_time = ? WHERE id = ?`,
            params: [newStartTime, newEndTime, id],
        });
    }
}
