import { Service } from 'typedi';
import { Router, Request, Response } from 'express';
import { PatientService } from './patient.service';
import { authMiddleware, AuthRequest } from '../../server/middlewares/auth.middleware';
import { patientMiddleware } from '../../server/middlewares/auth.middleware';

@Service()
export class PatientController {
    private router = Router();

    constructor(private readonly service: PatientService) {

        this.router.post('/', this.register.bind(this));
        this.router.put('/:id/profile', authMiddleware, patientMiddleware, this.updateProfile.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.service.register(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput' || error.message === 'InvalidPassword') {
                res.status(400).json({ message: 'Invalid data' });
            } else if (error.message === 'EmailExists') {
                res.status(409).json({ message: 'Email already exists' });
            } else {
                res.sendStatus(500);
            }
        }
    }

    async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const patientId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const result = await this.service.updateProfile(patientId, requesterId, req.body);
            res.status(200).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid data' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'Not this patient' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Patient does not exist' });
            } else {
                res.sendStatus(500);
            }
        }
    }

}
