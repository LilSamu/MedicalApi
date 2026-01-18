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

describe('MedicalRecordController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;
    let doctorToken: string;
    let doctorId: number;
    let patientId: number;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();

        await databaseService.execQuery({
            sql: 'INSERT INTO patients (name, email, password, phone, birth_date, address) VALUES (?, ?, ?, ?, ?, ?)',
            params: ['Patient One', 'p1@test.com', 'pass', '111', '1990-01-01', 'Home']
        });
        const pResult = await databaseService.execQuery({ sql: 'SELECT id FROM patients WHERE email = ?', params: ['p1@test.com'] });
        patientId = pResult.rows[0].id;

        await databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, location, qualifications, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: ['Dr. Record', 'record@hospital.com', 'pass', '555-REC', 'Office', 'GP', 1]
        });
        const dResult = await databaseService.execQuery({ sql: 'SELECT id FROM doctors WHERE email = ?', params: ['record@hospital.com'] });
        doctorId = dResult.rows[0].id;

        doctorToken = jwt.sign({ id: doctorId, role: 'doctor' }, config.user_sessions.secret, { expiresIn: '1d' });

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
        app.use('/api', api.getApiRouter());
    });

    it('should create a medical record successfully by a doctor', async () => {
        const res = await request(app)
            .post('/api/records')
            .set('Authorization', `Bearer ${doctorToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                diagnosis: 'Flu',
                prescriptions: 'Rest',
                notes: 'Drink water'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('record_id');
        expect(res.body).toHaveProperty('message', 'Record created');
    });

    it('should fail if patient does not exist', async () => {
        const res = await request(app)
            .post('/api/records')
            .set('Authorization', `Bearer ${doctorToken}`)
            .send({
                patient_id: 9999, 
                doctor_id: doctorId,
                diagnosis: 'Fake',
                prescriptions: 'None',
                notes: 'None'
            });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Patient or Doctor not found');
    });

    it('should update a medical record (doctor only)', async () => {
     
        const createRes = await request(app)
            .post('/api/records')
            .set('Authorization', `Bearer ${doctorToken}`)
            .send({
                patient_id: patientId,
                doctor_id: doctorId,
                diagnosis: 'Flu',
                prescriptions: 'Rest',
                notes: 'Drink water'
            });

        const recordId = createRes.body.record_id;

        const updateRes = await request(app)
            .put(`/api/records/${recordId}`)
            .set('Authorization', `Bearer ${doctorToken}`)
            .send({
                diagnosis: 'Severe Flu'
            });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body).toHaveProperty('record_id');
        expect(updateRes.body.message).toBe('Record updated');
    });
});
