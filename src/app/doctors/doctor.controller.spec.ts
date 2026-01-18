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

describe('DoctorController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();
        await databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, location, qualifications, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: ['Dr. House', 'house@hospital.com', 'vicodin', '555-HOUSE', 'Room 101', 'Diagnostician', 1]
        });

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
        app.use('/api', api.getApiRouter());
    });

    it('should list all doctors', async () => {
        const res = await request(app).get('/api/doctors');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0]).toHaveProperty('name', 'Dr. House');
    });

    it('should list doctors by specialty (department)', async () => {

        const res = await request(app).get('/api/doctors?specialty_id=1'); 

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    it('should register a new doctor (admin only)', async () => {
        const adminToken = jwt.sign({ id: 1, role: 'admin' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .post('/api/doctors')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'New Doctor',
                email: 'newdoc@hospital.com',
                password: 'pass',
                department_id: 1,
                location: 'New Wing'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('doctor_id');
    });

    it('should update doctor profile', async () => {
        const dRes = await databaseService.execQuery({ sql: 'SELECT id FROM doctors WHERE email = ?', params: ['house@hospital.com'] });
        const docId = dRes.rows[0].id;
        const docToken = jwt.sign({ id: docId, role: 'doctor' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .put(`/api/doctors/${docId}/profile`)
            .set('Authorization', `Bearer ${docToken}`)
            .send({ location: 'Remote' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Profile updated');
    });

    it('should create availability slot', async () => {
        const dRes = await databaseService.execQuery({ sql: 'SELECT id FROM doctors WHERE email = ?', params: ['house@hospital.com'] });
        const docId = dRes.rows[0].id;
        const docToken = jwt.sign({ id: docId, role: 'doctor' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .post(`/api/doctors/${docId}/availability`)
            .set('Authorization', `Bearer ${docToken}`)
            .send({
                start_time: '10:00',
                end_time: '12:00',
                location: 'Room 3'
            });

        expect(res.status).toBe(201);
    });
});
