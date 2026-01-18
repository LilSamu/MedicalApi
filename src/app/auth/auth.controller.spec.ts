import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { Container } from 'typedi';

import { DatabaseService } from '../../database/database.service';
import { config } from '../../config/environment';
import { Api } from '../../server/api/api';

import cors from 'cors';
import { json, urlencoded } from 'body-parser';

describe('AuthController Integration Test', () => {
    let app: express.Express;
    let databaseService: DatabaseService;

    beforeEach(async () => {
        config.dbOptions.database = ':memory:';
        Container.reset();

        databaseService = Container.get(DatabaseService);
        await databaseService.initializeDatabase();

        await databaseService.execQuery({
            sql: 'INSERT INTO patients (name, email, password, phone, birth_date, address) VALUES (?, ?, ?, ?, ?, ?)',
            params: ['Test User', 'test@test.com', 'password123', '555555', '1990-01-01', 'Test Address']
        });

        const api = Container.get(Api);

        app = express();
        app.use(cors());
        app.use(json({ limit: '5mb' }));
        app.use(urlencoded({ extended: false }));
     
        app.use('/api', api.getApiRouter());
    });

    afterAll(async () => {
        if (databaseService) {
        }
    });

    it('should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@test.com',
                password: 'password123',
                role: 'patient'
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@test.com',
                password: 'wrongpassword',
                role: 'patient'
            });

        expect(res.status).toBe(401);
    });

    it('should fail login with non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@test.com',
                password: 'password123',
                role: 'patient'
            });

        expect(res.status).toBe(401);
    });
});
