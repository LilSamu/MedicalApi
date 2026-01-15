import { Service } from 'typedi';
import { Router, Request, Response } from 'express';
import { PatientService } from './patient.service';


@Service()
export class PatientController {
    private router = Router();

    constructor(private readonly service: PatientService) {

        this.router.post('/', this.register.bind(this));
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


}
