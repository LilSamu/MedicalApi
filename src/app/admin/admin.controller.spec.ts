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
        const adminRes = await databaseService.execQuery({ sql: 'SELECT id FROM admins WHERE username = ?', params: ['admin'] });
        const adminId = adminRes.rows[0].id;
        adminToken = jwt.sign({ id: adminId, role: 'admin' }, config.user_sessions.secret, { expiresIn: '1d' });

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

    it('should list audit logs containing real actions', async () => {
      
        await databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, location, qualifications, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: ['Audit Doc', 'audit@doc.com', 'pass', '111', 'Office', 'MD', 1]
        });
        const dRes = await databaseService.execQuery({ sql: 'SELECT id FROM doctors WHERE email = ?', params: ['audit@doc.com'] });
        const docId = dRes.rows[0].id;
        const docToken = jwt.sign({ id: docId, role: 'doctor' }, config.user_sessions.secret, { expiresIn: '1d' });

        await request(app)
            .put(`/api/doctors/${docId}/profile`)
            .set('Authorization', `Bearer ${docToken}`)
            .send({ location: 'Audited Location' });

        const res = await request(app)
            .get('/api/admin/audit-logs')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const logs = res.body;

        const myLog = logs.find((l: any) => String(l.user_id) === String(docId) && l.resource_type === 'doctor');

        expect(myLog).toBeDefined();
       
        expect(myLog.action).not.toBe('');
        expect(String(myLog.resource_id)).toBe(String(docId));
    });

    it('should fail if not admin', async () => {
        const patientToken = jwt.sign({ id: 99, role: 'patient' }, config.user_sessions.secret, { expiresIn: '1d' });
        const doctorToken = jwt.sign({ id: 98, role: 'doctor' }, config.user_sessions.secret, { expiresIn: '1d' });

        const resP1 = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${patientToken}`);
        expect([401, 403]).toContain(resP1.status);

        const resP2 = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${patientToken}`);
        expect([401, 403]).toContain(resP2.status);

        const resD1 = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${doctorToken}`);
        expect([401, 403]).toContain(resD1.status);

        const resD2 = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${doctorToken}`);
        expect([401, 403]).toContain(resD2.status);

        const resNoAuth = await request(app).get('/api/admin/users');
        expect([401, 403]).toContain(resNoAuth.status); 
    });

    it('should filter users by name', async () => {

        await databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, location, qualifications, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: ['NameFiltered Doc', 'named@doc.com', 'pass', '111', 'Clinic', 'MD', 1]
        });

        const res = await request(app)
            .get('/api/admin/users?name=NameFiltered')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
  
        const found = res.body.find((u: any) => u.email === 'named@doc.com');
        expect(found).toBeDefined();
    });

    it('should filter users by role', async () => {
    
        await databaseService.execQuery({
            sql: 'INSERT INTO doctors (name, email, password, phone, location, qualifications, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            params: ['Filter Doc', 'filter@doc.com', 'pass', '111', 'Clinic', 'MD', 1]
        });

        const res = await request(app)
            .get('/api/admin/users?role=doctor')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
     
        const found = res.body.find((u: any) => u.email === 'filter@doc.com');
        expect(found).toBeDefined();
    });

    it('should list medical records (admin only)', async () => {
        const res = await request(app)
            .get('/api/admin/records')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
