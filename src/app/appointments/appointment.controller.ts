import { Service } from 'typedi';
import { Router, Response } from 'express';
import { AppointmentService } from './appointment.service';
import { authMiddleware, AuthRequest } from '../../server/middlewares/auth.middleware';

@Service()
export class AppointmentController {
    private router = Router();

    constructor(private readonly service: AppointmentService) {
        this.router.post('/', authMiddleware, this.book.bind(this));
        this.router.patch('/:id/cancel', authMiddleware, this.cancel.bind(this));
        this.router.patch('/:id/reschedule', authMiddleware, this.reschedule.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async book(req: AuthRequest, res: Response): Promise<void> {
        try {
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const result = await this.service.book(req.body, requesterId, requesterRole);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid time or data' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'Not this patient / not logged in' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Patient or doctor not found' });
            } else if (error.message === 'Conflict') {
                res.status(409).json({ message: 'Time slot already booked' });
            } else {
                res.sendStatus(500);
            }
        }
    }

    async cancel(req: AuthRequest, res: Response): Promise<void> {
        try {
            const appointmentId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const result = await this.service.cancel(appointmentId, requesterId, requesterRole, req.body?.reason);
            res.status(200).json(result);
        } catch (error: any) {
            if (error.message === 'CannotCancel') {
                res.status(400).json({ message: 'Appointment cannot be cancelled' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User not allowed to cancel' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Appointment not found' });
            } else {
                res.sendStatus(500);
            }
        }
    }

    async reschedule(req: AuthRequest, res: Response): Promise<void> {
        try {
            const appointmentId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const result = await this.service.reschedule(appointmentId, requesterId, requesterRole, req.body);
            res.status(200).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid new time' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User not allowed' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Appointment not found' });
            } else if (error.message === 'Conflict') {
                res.status(409).json({ message: 'New slot already booked' });
            } else {
                res.sendStatus(500);
            }
        }
    }
}
