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

describe('AdminController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;
    let adminToken: string;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();
        adminToken = jwt.sign({ id: 1, role: 'admin' }, config.user_sessions.secret, { expiresIn: '1d' });

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
        app.use('/api', api.getApiRouter());
    });

    it('should list users (admin only)', async () => {
        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should list audit logs (audit check)', async () => {
        const res = await request(app)
            .get('/api/admin/audit-logs')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fail if not admin', async () => {
        const patientToken = jwt.sign({ id: 99, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });

        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${patientToken}`);

        expect([401, 403]).toContain(res.status);
    });
});
