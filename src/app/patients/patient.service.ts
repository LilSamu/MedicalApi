import { Service } from 'typedi';
import { PatientRepository } from './patient.repository';
import { Patient } from './patient.model';

interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone?: string;
    birth_date?: string;
    address?: string;
}

interface UpdateProfileData {
    name?: string;
    phone?: string;
    address?: string;
}

@Service()
export class PatientService {
    constructor(private readonly repository: PatientRepository) { }

    async register(data: RegisterData): Promise<{ message: string; patient_id: string }> {
        const { name, email, password, phone, birth_date, address } = data;

        if (!name || !email || !password || !phone || !birth_date || !address) {
            throw new Error('InvalidInput');
        }

        if (password.length < 6) {
            throw new Error('InvalidPassword');
        }

        const existing = await this.repository.findByEmail(email);
        if (existing) {
            throw new Error('EmailExists');
        }

        const newPatient: Patient = {
            name,
            email,
            password,
            phone,
            birth_date,
            address,
        };

        const created = await this.repository.create(newPatient);

        return {
            message: 'Patient registered',
            patient_id: String(created.id),
        };
    }

}
