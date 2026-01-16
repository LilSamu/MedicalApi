import { Service } from 'typedi';
import { AppointmentRepository } from './appointment.repository';

interface BookData {
    patient_id: string;
    doctor_id: string;
    start_time: string;
    end_time: string;
    reason?: string;
}

interface RescheduleData {
    new_start_time: string;
    new_end_time: string;
}

@Service()
export class AppointmentService {
    constructor(private readonly repository: AppointmentRepository) { }

    async book(data: BookData, requesterId: number, requesterRole: string): Promise<{ message: string; appointment_id: string }> {
        const { patient_id, doctor_id, start_time, end_time } = data;

        if (!patient_id || !doctor_id || !start_time || !end_time) {
            throw new Error('InvalidInput');
        }

        const patientId = parseInt(patient_id);
        const doctorId = parseInt(doctor_id);

        if (requesterRole === 'patient' && requesterId !== patientId) {
            throw new Error('Unauthorized');
        }

        const patientExists = await this.repository.patientExists(patientId);
        const doctorExists = await this.repository.doctorExists(doctorId);
        if (!patientExists || !doctorExists) {
            throw new Error('NotFound');
        }

        const isAvailable = await this.repository.isDoctorAvailable(doctorId, start_time, end_time);
        if (!isAvailable) {
            throw new Error('InvalidInput');
        }

        const hasConflict = await this.repository.hasConflictingAppointment(doctorId, start_time, end_time);
        if (hasConflict) {
            throw new Error('Conflict');
        }

        const created = await this.repository.create({
            patient_id: patientId,
            doctor_id: doctorId,
            start_time,
            end_time,
            reason: data.reason,
            status: 'scheduled',
        });

        return {
            message: 'Appointment booked',
            appointment_id: String(created.id),
        };
    }

    async cancel(appointmentId: number, requesterId: number, requesterRole: string, reason: string): Promise<{ message: string; appointment_id: string }> {
        const appointment = await this.repository.findById(appointmentId);
        if (!appointment) {
            throw new Error('NotFound');
        }

        const isPatient = requesterRole === 'patient' && appointment.patient_id === requesterId;
        const isDoctor = requesterRole === 'doctor' && appointment.doctor_id === requesterId;
        if (!isPatient && !isDoctor) {
            throw new Error('Unauthorized');
        }

        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            throw new Error('CannotCancel');
        }

        await this.repository.cancel(appointmentId, reason);

        return {
            message: 'Appointment cancelled',
            appointment_id: String(appointmentId),
        };
    }

    async reschedule(appointmentId: number, requesterId: number, requesterRole: string, data: RescheduleData): Promise<{ message: string; appointment_id: string }> {
        const { new_start_time, new_end_time } = data;

        if (!new_start_time || !new_end_time) {
            throw new Error('InvalidInput');
        }

        const appointment = await this.repository.findById(appointmentId);
        if (!appointment) {
            throw new Error('NotFound');
        }

        const isPatient = requesterRole === 'patient' && appointment.patient_id === requesterId;
        const isDoctor = requesterRole === 'doctor' && appointment.doctor_id === requesterId;
        if (!isPatient && !isDoctor) {
            throw new Error('Unauthorized');
        }

        const hasConflict = await this.repository.hasConflictingAppointment(
            appointment.doctor_id, new_start_time, new_end_time, appointmentId
        );
        if (hasConflict) {
            throw new Error('Conflict');
        }

        await this.repository.reschedule(appointmentId, new_start_time, new_end_time);

        return {
            message: 'Appointment rescheduled',
            appointment_id: String(appointmentId),
        };
    }
}
