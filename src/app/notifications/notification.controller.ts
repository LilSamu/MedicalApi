import { Service } from 'typedi';
import { Router, Response } from 'express';
import { NotificationService } from './notification.service';
import { authMiddleware, AuthRequest } from '../../server/middlewares/auth.middleware';

@Service()
export class NotificationController {
    private router = Router();

    constructor(private readonly service: NotificationService) {
        this.router.post('/', authMiddleware, this.send.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async send(req: AuthRequest, res: Response): Promise<void> {
        try {
            const result = await this.service.send(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid data' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'User not found' });
            } else {
                res.sendStatus(500);
            }
        }
    }
}
