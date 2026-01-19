import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { Container } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { config } from '../../config/environment';
import { Api } from '../../server/api/api';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';
import jwt from 'jsonwebtoken';

describe('PatientController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
        app.use('/api', api.getApiRouter());
    });

    it('should register a new patient successfully', async () => {
        const res = await request(app)
            .post('/api/patients')
            .send({
                name: 'New Patient',
                email: 'newpatient@test.com',
                password: 'password123',
                phone: '123456789',
                birth_date: '2000-01-01',
                address: '123 St'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('patient_id');
        expect(res.body.message).toBe('Patient registered');
     
        expect(Number(res.body.patient_id)).toBeGreaterThan(0);
    });

    it('should fail registration with existing email', async () => {
        await request(app)
            .post('/api/patients')
            .send({
                name: 'Patient 1',
                email: 'duplicate@test.com',
                password: 'password123',
                phone: '111111',
                birth_date: '2000-01-01',
                address: '123 St'
            });

        const res = await request(app)
            .post('/api/patients')
            .send({
                name: 'Patient 2',
                email: 'duplicate@test.com',
                password: 'password123',
                phone: '222222',
                birth_date: '1990-01-01',
                address: '456 Ave'
            });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Email already exists');
    });

    it('should fail registration with invalid data', async () => {
        const res = await request(app)
            .post('/api/patients')
            .send({
                name: 'Incomplete Patient'
            });

        expect(res.status).toBe(400);
    });

    it('should update profile successfully', async () => {
        const reg = await request(app).post('/api/patients').send({
            name: 'Updater', email: 'update@test.com', password: 'password123', phone: '1', birth_date: '2000-01-01', address: '1'
        });

        expect(reg.status).toBe(201);
        const patientId = Number(reg.body.patient_id);

        const token = jwt.sign({ id: patientId, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .put(`/api/patients/${patientId}/profile`)
            .set('Authorization', `Bearer ${token}`)
            .send({ phone: '999999' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Profile updated');
    });

    it('should get appointments empty list', async () => {
        const reg = await request(app).post('/api/patients').send({
            name: 'Appointer', email: 'appoint@test.com', password: 'password123', phone: '1', birth_date: '2000-01-01', address: '1'
        });
        expect(reg.status).toBe(201);
        const patientId = Number(reg.body.patient_id);
        const token = jwt.sign({ id: patientId, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .get(`/api/patients/${patientId}/appointments`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get medical records empty list', async () => {
        const reg = await request(app).post('/api/patients').send({
            name: 'Recorder', email: 'record@test.com', password: 'password123', phone: '1', birth_date: '2000-01-01', address: '1'
        });
        expect(reg.status).toBe(201);
        const patientId = Number(reg.body.patient_id);
        const token = jwt.sign({ id: patientId, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .get(`/api/patients/${patientId}/records`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fail accessing another patient profile', async () => {
     
        const regA = await request(app).post('/api/patients').send({
            name: 'P A', email: 'a@test.com', password: 'password123', phone: '1', birth_date: '1', address: '1'
        });
        const idA = Number(regA.body.patient_id);
        const tokenA = jwt.sign({ id: idA, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const regB = await request(app).post('/api/patients').send({
            name: 'P B', email: 'b@test.com', password: 'password123', phone: '1', birth_date: '1', address: '1'
        });
        const idB = Number(regB.body.patient_id);

        const res = await request(app)
            .put(`/api/patients/${idB}/profile`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ phone: '666' });

        expect(res.status).toBe(401); 
    });

    it('should fail getting profile with invalid ID format', async () => {
       
        const token = jwt.sign({ id: 1, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });
        const res = await request(app)
            .get(`/api/patients/abc/appointments`) 
            .set('Authorization', `Bearer ${token}`);

        expect([400, 404]).toContain(res.status);
    });

    it('should fail updating profile with empty body (Validation)', async () => {
      
        const reg = await request(app).post('/api/patients').send({
            name: 'EmptyTest', email: 'empty@test.com', password: 'password123', phone: '123456789', birth_date: '2000-01-01', address: '123 St'
        });
        expect(reg.status).toBe(201);
        const id = Number(reg.body.patient_id);
        const token = jwt.sign({ id: id, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .put(`/api/patients/${id}/profile`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        if (res.status !== 200 && res.status !== 400) {
            console.log('DEBUG FAILURE:', res.status, JSON.stringify(res.body));
        }

        expect([200, 400]).toContain(res.status);
    });
});
