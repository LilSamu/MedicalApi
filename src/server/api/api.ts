import { Router } from 'express';
import { Service } from 'typedi';
import { AuthController } from '../../app/auth/auth.controller';
import { PatientController } from '../../app/patients/patient.controller';
import { DoctorController } from '../../app/doctors/doctor.controller';
import { AppointmentController } from '../../app/appointments/appointment.controller';

@Service()
export class Api {
    private apiRouter: Router;

    constructor(
        private authController: AuthController,
        private patientController: PatientController,
        private doctorController: DoctorController,
        private appointmentController: AppointmentController,
    ) {
        this.apiRouter = Router();

        this.apiRouter.use('/auth', this.authController.getRouter());
        this.apiRouter.use('/patients', this.patientController.getRouter());
        this.apiRouter.use('/doctors', this.doctorController.getRouter());
        this.apiRouter.use('/appointments', this.appointmentController.getRouter());
    }

    getApiRouter(): Router {
        return this.apiRouter;
    }
}
