import { Router } from 'express';
import { Service } from 'typedi';

@Service()
export class Api {
    private apiRouter: Router;

    constructor() {
        this.apiRouter = Router();
        // Aqui los controladores, tipo esto this.apiRouter.use('/patients', this.patientController.getRouter());
    }

    getApiRouter(): Router {
        return this.apiRouter;
    }
}
