import { Service } from 'typedi';
import { DoctorRepository } from './doctor.repository';
import { Doctor, AvailabilitySlot } from './doctor.model';

interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone?: string;
    department_id?: string;
    specialty_ids?: string[];
    location?: string;
}

interface UpdateProfileData {
    name?: string;
    phone?: string;
    location?: string;
}

@Service()
export class DoctorService {
    constructor(private readonly repository: DoctorRepository) { }

    async register(data: RegisterData): Promise<{ message: string; doctor_id: string }> {
        const { name, email, password } = data;

        if (!name || !email || !password) {
            throw new Error('InvalidInput');
        }

        const existing = await this.repository.findByEmail(email);
        if (existing) {
            throw new Error('EmailExists');
        }

        const newDoctor: Doctor = {
            name,
            email,
            password,
            phone: data.phone,
            department_id: data.department_id ? parseInt(data.department_id) : undefined,
            location: data.location,
        };

        const created = await this.repository.create(newDoctor);

        if (data.specialty_ids && data.specialty_ids.length > 0) {
            const specialtyIds = data.specialty_ids.map(id => parseInt(id));
            await this.repository.addSpecialties(created.id!, specialtyIds);
        }

        return {
            message: 'Doctor created',
            doctor_id: String(created.id),
        };
    }

    async updateProfile(doctorId: number, requesterId: number, requesterRole: string, data: UpdateProfileData): Promise<{ message: string; doctor_id: string }> {
        const doctor = await this.repository.findById(doctorId);
        if (!doctor) {
            throw new Error('NotFound');
        }

        if (doctor.id !== requesterId && requesterRole !== 'admin') {
            throw new Error('Unauthorized');
        }

        if (!data.name && !data.phone && !data.location) {
            throw new Error('InvalidInput');
        }

        await this.repository.update(doctorId, data);

        return {
            message: 'Profile updated',
            doctor_id: String(doctorId),
        };
    }

    async createAvailabilitySlot(doctorId: number, requesterId: number, data: { start_time: string; end_time: string; location?: string }): Promise<{ message: string; slot_id: string }> {
        const doctor = await this.repository.findById(doctorId);
        if (!doctor) {
            throw new Error('NotFound');
        }

        if (doctor.id !== requesterId) {
            throw new Error('Unauthorized');
        }

        if (!data.start_time || !data.end_time) {
            throw new Error('InvalidInput');
        }

        const hasOverlap = await this.repository.hasOverlappingSlot(doctorId, data.start_time, data.end_time);
        if (hasOverlap) {
            throw new Error('OverlappingSlot');
        }

        const slot: AvailabilitySlot = {
            doctor_id: doctorId,
            start_time: data.start_time,
            end_time: data.end_time,
            location: data.location,
        };

        const created = await this.repository.createAvailabilitySlot(slot);

        return {
            message: 'Availability slot created',
            slot_id: String(created.id),
        };
    }

    async getAppointments(doctorId: number, requesterId: number, requesterRole: string): Promise<any[]> {
        const doctor = await this.repository.findById(doctorId);
        if (!doctor) {
            throw new Error('NotFound');
        }
        if (doctor.id !== requesterId && requesterRole !== 'admin') {
            throw new Error('Unauthorized');
        }

        return this.repository.getAppointments(doctorId);
    }

    async updateSpecialties(doctorId: number, requesterId: number, requesterRole: string, specialtyIds: string[]): Promise<{ message: string; doctor_id: string }> {
        const doctor = await this.repository.findById(doctorId);
        if (!doctor) {
            throw new Error('NotFound');
        }

        if (doctor.id !== requesterId && requesterRole !== 'admin') {
            throw new Error('Unauthorized');
        }

        if (!specialtyIds || specialtyIds.length === 0) {
            throw new Error('InvalidInput');
        }

        for (const id of specialtyIds) {
            const exists = await this.repository.specialtyExists(parseInt(id));
            if (!exists) {
                throw new Error('SpecialtyNotFound');
            }
        }

        await this.repository.addSpecialties(doctorId, specialtyIds.map(id => parseInt(id)));

        return {
            message: 'Specialties updated',
            doctor_id: String(doctorId),
        };
    }

    async searchDoctors(filters: { specialty_id?: string; date?: string; location?: string }): Promise<any[]> {
        return this.repository.searchDoctors(filters);
    }
}
