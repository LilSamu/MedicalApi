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

describe('NotificationController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;
    let userToken: string;
    let patientId: number;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();

        await databaseService.execQuery({
            sql: 'INSERT INTO patients (name, email, password, phone, birth_date, address) VALUES (?, ?, ?, ?, ?, ?)',
            params: ['Notif User', 'notif@test.com', 'pass', '555', '2000-01-01', 'Address']
        });
        const pResult = await databaseService.execQuery({ sql: 'SELECT id FROM patients WHERE email = ?', params: ['notif@test.com'] });
        patientId = pResult.rows[0].id;

        userToken = jwt.sign({ id: patientId, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
        app.use('/api', api.getApiRouter());
    });

    it('should send a notification successfully (201)', async () => {
        const res = await request(app)
            .post('/api/notifications')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                user_id: String(patientId), 
                type: 'info',
                message: 'Test notification'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'Notification created');
    });
});
