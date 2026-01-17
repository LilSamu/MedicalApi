import { Service } from 'typedi';
import { Router, Request, Response } from 'express';
import { DepartmentService } from './department.service';

@Service()
export class DepartmentController {
    private router = Router();

    constructor(private readonly service: DepartmentService) {
        this.router.get('/', this.findAll.bind(this));
    }

    getRouter(): Router {
        return this.router;
    }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const departments = await this.service.findAll();
            res.status(200).json(departments);
        } catch (error: any) {
            res.sendStatus(500);
        }
    }
}
