import { Service } from 'typedi';
import { Router, Request, Response } from 'express';
import { SpecialtyService } from './specialty.service';

@Service()
export class SpecialtyController {
    private router = Router();

    constructor(private readonly service: SpecialtyService) {
        this.router.get('/', this.findAll.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const specialties = await this.service.findAll();
            res.status(200).json(specialties);
        } catch (error: any) {
            res.sendStatus(500);
        }
    }
}
