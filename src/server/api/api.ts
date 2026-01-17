import { Router } from 'express';
import { Service } from 'typedi';
import { AuthController } from '../../app/auth/auth.controller';
import { PatientController } from '../../app/patients/patient.controller';
import { DoctorController } from '../../app/doctors/doctor.controller';
import { AppointmentController } from '../../app/appointments/appointment.controller';
import { MedicalRecordController } from '../../app/medical-records/medical-record.controller';
import { SpecialtyController } from '../../app/specialties/specialty.controller';
import { DepartmentController } from '../../app/departments/department.controller';
import { NotificationController } from '../../app/notifications/notification.controller';
import { AdminController } from '../../app/admin/admin.controller';

@Service()
export class Api {
    private apiRouter: Router;

    constructor(
        private authController: AuthController,
        private patientController: PatientController,
        private doctorController: DoctorController,
        private appointmentController: AppointmentController,
        private medicalRecordController: MedicalRecordController,
        private specialtyController: SpecialtyController,
        private departmentController: DepartmentController,
        private notificationController: NotificationController,
        private adminController: AdminController,
    ) {
        this.apiRouter = Router();

        this.apiRouter.use('/auth', this.authController.getRouter());
        this.apiRouter.use('/patients', this.patientController.getRouter());
        this.apiRouter.use('/doctors', this.doctorController.getRouter());
        this.apiRouter.use('/appointments', this.appointmentController.getRouter());
        this.apiRouter.use('/records', this.medicalRecordController.getRouter());
        this.apiRouter.use('/specialties', this.specialtyController.getRouter());
        this.apiRouter.use('/departments', this.departmentController.getRouter());
        this.apiRouter.use('/notifications', this.notificationController.getRouter());
        this.apiRouter.use('/admin', this.adminController.getRouter());
    }

    getApiRouter(): Router {
        return this.apiRouter;
    }
}

