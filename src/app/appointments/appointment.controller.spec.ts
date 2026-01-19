import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { Container } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { config } from '../../config/environment';
import { Api } from '../../server/api/api';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { json, urlencoded } from 'body-parser';

describe('AppointmentController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;
    let patientToken: string;
    let doctorId: number;
    let patientId: number;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();

        await databaseService.execQuery({
            sql: 'INSERT INTO patients (name, email, password, phone, birth_date, address) VALUES (?, ?, ?, ?, ?, ?)',
            params: ['Patient Zero', 'patient@zero.com', 'pass', '555', '2000-01-01', 'Earth']
        });
        const pResult = await databaseService.execQuery({ sql: 'SELECT id FROM patients WHERE email = ?', params: ['patient@zero.com'] });
        patientId = pResult.rows[0].id;

        await databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, location, qualifications, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: ['Dr. Strange', 'strange@marvel.com', 'magic', '555-MAGIC', 'Sanctum', 'Sorcerer', 1]
        });
        const dResult = await databaseService.execQuery({ sql: 'SELECT id FROM doctors WHERE email = ?', params: ['strange@marvel.com'] });
        doctorId = dResult.rows[0].id;

        await databaseService.execQuery({
            sql: 'INSERT INTO availability_slots (doctor_id, start_time, end_time, location) VALUES (?, ?, ?, ?)',
            params: [doctorId, '08:00', '17:00', 'Office']
        });

        patientToken = jwt.sign({ id: patientId, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
        app.use('/api', api.getApiRouter());
    });

    it('should book an appointment successfully', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                start_time: '09:00',
                end_time: '09:30',
                reason: 'Checkup'
            });

        if (res.status !== 201) {
            console.log('Appointment Test Fail:', res.status, JSON.stringify(res.body));
        }

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('appointment_id');
    
        expect(res.body).toHaveProperty('message', 'Appointment booked');
    });

    it('should fail booking without auth', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .send({
                doctor_id: doctorId,
                date: '2025-01-01',
                start_time: '09:00',
                reason: 'Checkup'
            });

        expect(res.status).toBe(401);
    });

    it('should cancel an appointment', async () => {
     
        const resCreate = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                start_time: '12:00',
                end_time: '12:30',
                reason: 'To Cancel'
            });
        const appointmentId = resCreate.body.appointment_id;

        const resCancel = await request(app)
            .patch(`/api/appointments/${appointmentId}/cancel`)
            .set('Authorization', `Bearer ${patientToken}`)
            .send({ reason: 'Changed mind' });

        expect(resCancel.status).toBe(200);
        expect(resCancel.body.message).toBe('Appointment cancelled');
    });

    it('should reschedule an appointment', async () => {
     
        const resCreate = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                start_time: '14:00',
                end_time: '14:30',
                reason: 'To Reschedule'
            });
        const appointmentId = resCreate.body.appointment_id;

        const resResched = await request(app)
            .patch(`/api/appointments/${appointmentId}/reschedule`)
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                new_start_time: '15:00',
                new_end_time: '15:30'
            });

        expect(resResched.status).toBe(200);
        expect(resResched.body.message).toBe('Appointment rescheduled');
    });

    it('should fail booking with invalid time range (start > end)', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                start_time: '10:00',
                end_time: '09:00', 
                reason: 'Time Travel'
            });

        expect(res.status).toBe(400);
    });

    it('should fail booking with non-existent doctor', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: 99999, 
                start_time: '10:00',
                end_time: '10:30',
                reason: 'Ghost Doctor'
            });

        expect(res.status).toBe(404);
    });

    it('should return 404 for invalid endpoint/method on appointments', async () => {
     
        const res = await request(app)
            .patch('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({});

        expect(res.status).toBe(404);
    });


    it('should fail double booking (Conflict)', async () => {
      
        await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                start_time: '10:00',
                end_time: '10:30',
                reason: 'First'
            });

        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                start_time: '10:00',
                end_time: '10:30',
                reason: 'Overlap'
            });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Time slot already booked');
    });

    it('should fail rescheduling to a booked slot', async () => {
   
        await request(app).post('/api/appointments').set('Authorization', `Bearer ${patientToken}`)
            .send({ patient_id: patientId, doctor_id: doctorId, start_time: '16:00', end_time: '16:30' });

        const resB = await request(app).post('/api/appointments').set('Authorization', `Bearer ${patientToken}`)
            .send({ patient_id: patientId, doctor_id: doctorId, start_time: '16:30', end_time: '17:00' });
        const idB = resB.body.appointment_id;

        const res = await request(app)
            .patch(`/api/appointments/${idB}/reschedule`)
            .set('Authorization', `Bearer ${patientToken}`)
            .send({ new_start_time: '16:00', new_end_time: '16:30' });

        expect(res.status).toBe(409);
    });

    it('should fail cancelling an already cancelled appointment', async () => {
   
        const resCreate = await request(app).post('/api/appointments').set('Authorization', `Bearer ${patientToken}`)
            .send({ patient_id: patientId, doctor_id: doctorId, start_time: '11:00', end_time: '11:30' });
        const id = resCreate.body.appointment_id;

        await request(app).patch(`/api/appointments/${id}/cancel`).set('Authorization', `Bearer ${patientToken}`).send();

        const res = await request(app)
            .patch(`/api/appointments/${id}/cancel`)
            .set('Authorization', `Bearer ${patientToken}`)
            .send();

        expect(res.status).toBe(400); 
    });
});
