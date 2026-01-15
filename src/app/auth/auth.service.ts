import { Service } from 'typedi';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { config } from '../../config/environment';

interface LoginData {
    email?: string;
    username?: string;
    password: string;
    role: 'patient' | 'doctor' | 'admin';
}

@Service()
export class AuthService {
    constructor(private readonly repository: AuthRepository) { }

    async login(data: LoginData): Promise<string> {
        const { email, username, password, role } = data;

        if (!password || !role) {
            throw new Error('InvalidInput');
        }

        let user: any = null;

        if (role === 'patient') {
            if (!email) throw new Error('InvalidInput');
            user = await this.repository.findPatientByEmail(email);
        } else if (role === 'doctor') {
            if (!email) throw new Error('InvalidInput');
            user = await this.repository.findDoctorByEmail(email);
        } else if (role === 'admin') {
            if (!username) throw new Error('InvalidInput');
            user = await this.repository.findAdminByUsername(username);
        }

        if (!user || user.password !== password) {
            throw new Error('InvalidCredentials');
        }

        const payload = { id: user.id, role };

        const token = jwt.sign(payload, config.user_sessions.secret, {
            expiresIn: `${config.user_sessions.expiration_days}d`,
        });

        return token;
    }
}
