import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { Service } from 'typedi';
import { config } from '../config/environment';

import path from 'path';
import { DBQuery } from './models/db-query';
import { DBQueryResult } from './models/db-query-result';

@Service()
export class DatabaseService {
    private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

    public async openDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
        if (this.db) {
            return this.db;
        }

        const filename =
            config.dbOptions.database === ':memory:'
                ? ':memory:'
                : path.join(__dirname, `../data/${config.dbOptions.database}`);

        this.db = await open({
            filename,
            driver: sqlite3.Database,
        });

        await this.db.exec('PRAGMA foreign_keys = ON;');

        return this.db;
    }

    public async closeDatabase(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }

    public async execQuery(query: DBQuery): Promise<DBQueryResult> {
        const dbClient = await this.openDatabase();
        const { sql, params } = query;

        try {
            const rows: [] = await dbClient.all(sql, params);
            return { rows: rows, rowCount: rows.length };
        } finally {
            if (config.dbOptions.database !== ':memory:') {
                await this.closeDatabase();
            }
        }
    }

    public async initializeDatabase(): Promise<void> {
        await this.openDatabase();

        // Tabla de departamentos
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        services TEXT
      )
    `);

        // Tabla de especialidades
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS specialties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

        // Tabla de pacientes
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        birth_date TEXT,
        address TEXT
      )
    `);

        // Tabla de doctores
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        department_id INTEGER,
        location TEXT,
        qualifications TEXT,
        FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

        // Tabla de relación doctores-especialidades
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS doctor_specialties (
        doctor_id INTEGER NOT NULL,
        specialty_id INTEGER NOT NULL,
        PRIMARY KEY(doctor_id, specialty_id),
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(specialty_id) REFERENCES specialties(id) ON DELETE CASCADE
      )
    `);

        // Tabla de slots de disponibilidad
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS availability_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

        // Tabla de citas
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'scheduled',
        cancellation_reason TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

        // Tabla de historiales médicos
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        diagnosis TEXT,
        prescriptions TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

        // Tabla de resultados de tests
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        result TEXT,
        FOREIGN KEY(record_id) REFERENCES medical_records(id) ON DELETE CASCADE
      )
    `);

        // Tabla de tratamientos
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS treatments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        FOREIGN KEY(record_id) REFERENCES medical_records(id) ON DELETE CASCADE
      )
    `);

        // Tabla de notificaciones
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Tabla de logs de auditoría
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        timestamp TEXT NOT NULL
      )
    `);

        // Tabla de admins
        await this.db!.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

        if (config.dbOptions.database !== ':memory:') {
            await this.closeDatabase();
        }
    }
}
