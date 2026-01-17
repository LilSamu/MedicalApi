import { Service } from 'typedi';
import { Router, Response } from 'express';
import { AdminService } from './admin.service';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../server/middlewares/auth.middleware';

@Service()
export class AdminController {
    private router = Router();

    constructor(private readonly service: AdminService) {
        this.router.get('/users', authMiddleware, adminMiddleware, this.searchUsers.bind(this));
        this.router.get('/records', authMiddleware, adminMiddleware, this.searchMedicalRecords.bind(this));
        this.router.get('/audit-logs', authMiddleware, adminMiddleware, this.getAuditLogs.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async searchUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const filters = {
                role: req.query.role as string,
                name: req.query.name as string,
                email: req.query.email as string,
            };
            const requesterRole = req.userRole || '';
            const users = await this.service.searchUsers(filters, requesterRole);
            res.status(200).json(users);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User is not admin' });
            } else {
                res.sendStatus(500);
            }
        }
    }

    async searchMedicalRecords(req: AuthRequest, res: Response): Promise<void> {
        try {
            const filters = {
                patient_id: req.query.patient_id as string,
                doctor_id: req.query.doctor_id as string,
                from_date: req.query.from_date as string,
                to_date: req.query.to_date as string,
            };
            const requesterRole = req.userRole || '';
            const records = await this.service.searchMedicalRecords(filters, requesterRole);
            res.status(200).json(records);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User is not admin' });
            } else {
                res.sendStatus(500);
            }
        }
    }

    async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
        try {
            const filters = {
                user_id: req.query.user_id as string,
                action: req.query.action as string,
                from_date: req.query.from_date as string,
                to_date: req.query.to_date as string,
            };
            const requesterRole = req.userRole || '';
            const logs = await this.service.getAuditLogs(filters, requesterRole);
            res.status(200).json(logs);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User is not admin' });
            } else {
                res.sendStatus(500);
            }
        }
    }
}
