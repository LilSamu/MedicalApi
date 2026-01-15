import { Router } from 'express';
import { Service } from 'typedi';
import { AuthController } from '../../app/auth/auth.controller';

@Service()
export class Api {
    private apiRouter: Router;

    constructor(
        private authController: AuthController,
    ) {
        this.apiRouter = Router();

        
        this.apiRouter.use('/auth', this.authController.getRouter());
    }

    getApiRouter(): Router {
        return this.apiRouter;
    }
}
