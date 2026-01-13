import { Service } from 'typedi';
import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';

@Service()
export class AuthController {
    private router = Router();

    constructor(private readonly service: AuthService) {
        this.router.post('/login', this.login.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async login(req: Request, res: Response): Promise<void> {
        const loginData = req.body;

        try {
            const token = await this.service.login(loginData);
            res.json({ token });
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid input data' });
            } else if (error.message === 'InvalidCredentials') {
                res.status(401).json({ message: 'Invalid credentials' });
            } else {
                res.sendStatus(500);
            }
        }
    }
}
