import { Service } from 'typedi';
import { DoctorRepository } from './doctor.repository';
import { Doctor } from './doctor.model';

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

    async searchDoctors(filters: { specialty_id?: string; date?: string; location?: string }): Promise<any[]> {
        return this.repository.searchDoctors(filters);
    }
}
