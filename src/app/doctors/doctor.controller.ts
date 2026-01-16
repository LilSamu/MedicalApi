import { Service } from 'typedi';
import { Router, Request, Response } from 'express';
import { DoctorService } from './doctor.service';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../server/middlewares/auth.middleware';

@Service()
export class DoctorController {
    private router = Router();

    constructor(private readonly service: DoctorService) {

        this.router.post('/', authMiddleware, adminMiddleware, this.register.bind(this));
        this.router.get('/', this.searchDoctors.bind(this));
        this.router.put('/:id/profile', authMiddleware, this.updateProfile.bind(this));
        this.router.post('/:id/availability', authMiddleware, this.createAvailabilitySlot.bind(this));
        this.router.get('/:id/appointments', authMiddleware, this.getAppointments.bind(this));
        this.router.put('/:id/specialties', authMiddleware, this.updateSpecialties.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async register(req: AuthRequest, res: Response): Promise<void> {
        try {
            const result = await this.service.register(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid data' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'User is not admin' });
            } else if (error.message === 'EmailExists') {
                res.status(409).json({ message: 'Email already exists' });
            } else {
                
                res.sendStatus(500);
            }
        }
    }

    async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const doctorId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const result = await this.service.updateProfile(doctorId, requesterId, requesterRole, req.body);
            res.status(200).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid data' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'Not this doctor / not admin' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Doctor does not exist' });
            } else {
                
                res.sendStatus(500);
            }
        }
    }

    async createAvailabilitySlot(req: AuthRequest, res: Response): Promise<void> {
        try {
            const doctorId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const result = await this.service.createAvailabilitySlot(doctorId, requesterId, req.body);
            res.status(201).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput' || error.message === 'OverlappingSlot') {
                res.status(400).json({ message: 'Invalid or overlapping time range' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'Not this doctor' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Doctor does not exist' });
            } else {
                
                res.sendStatus(500);
            }
        }
    }

    async getAppointments(req: AuthRequest, res: Response): Promise<void> {
        try {
            const doctorId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const appointments = await this.service.getAppointments(doctorId, requesterId, requesterRole);
            res.status(200).json(appointments);
        } catch (error: any) {
            if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'Not this doctor / not allowed' });
            } else if (error.message === 'NotFound') {
                res.status(404).json({ message: 'Doctor does not exist' });
            } else {
                
                res.sendStatus(500);
            }
        }
    }

    async updateSpecialties(req: AuthRequest, res: Response): Promise<void> {
        try {
            const doctorId = parseInt(req.params.id as string);
            const requesterId = req.userId!;
            const requesterRole = req.userRole || '';
            const result = await this.service.updateSpecialties(doctorId, requesterId, requesterRole, req.body.specialty_ids);
            res.status(200).json(result);
        } catch (error: any) {
            if (error.message === 'InvalidInput') {
                res.status(400).json({ message: 'Invalid list' });
            } else if (error.message === 'Unauthorized') {
                res.status(401).json({ message: 'Not this doctor / not admin' });
            } else if (error.message === 'NotFound' || error.message === 'SpecialtyNotFound') {
                res.status(404).json({ message: 'Doctor or specialties not found' });
            } else {
                
                res.sendStatus(500);
            }
        }
    }

    async searchDoctors(req: Request, res: Response): Promise<void> {
        try {
            const filters = {
                specialty_id: req.query.specialty_id as string,
                date: req.query.date as string,
                location: req.query.location as string,
            };
            const doctors = await this.service.searchDoctors(filters);
            res.status(200).json(doctors);
        } catch (error: any) {
            res.sendStatus(500);
        }
    }
}
