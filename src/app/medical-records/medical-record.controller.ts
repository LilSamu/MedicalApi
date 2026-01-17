import { Service } from 'typedi';
import { Router, Response } from 'express';
import { MedicalRecordService } from './medical-record.service';
import { authMiddleware, AuthRequest } from '../../server/middlewares/auth.middleware';

@Service()
export class MedicalRecordController {
    private router = Router();

    constructor(private readonly service: MedicalRecordService) {
        this.router.post('/', authMiddleware, this.create.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const result = await this.service.create(req.body, requesterId, requesterRole);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid data' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User not authorized' });
            } else if (error.message === 'Forbidden') {
                res.status(403).json({ message: 'Doctor not authorized for this patient' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Patient or Doctor not found' });
            } else {
                res.sendStatus(500);
            }
        }
    }
}
