import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';

export interface AuditLog {
    id?: number;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    timestamp: string;
}

@Service()
export class AuditLogRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(log: AuditLog): Promise<void> {
        await this.databaseService.execQuery({
            sql: 'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, timestamp) VALUES (?, ?, ?, ?, ?)',
            params: [log.user_id, log.action, log.resource_type, log.resource_id, log.timestamp],
        });
    }

    async findAll(filters: { user_id?: string; action?: string; from_date?: string; to_date?: string }): Promise<any[]> {
        let sql = 'SELECT id as log_id, user_id, action, resource_type, resource_id, timestamp FROM audit_logs WHERE 1=1';
        const params: any[] = [];

        if (filters.user_id) {
            sql += ' AND user_id = ?';
            params.push(filters.user_id);
        }
        if (filters.action) {
            sql += ' AND action = ?';
            params.push(filters.action);
        }
        if (filters.from_date) {
            sql += ' AND timestamp >= ?';
            params.push(filters.from_date);
        }
        if (filters.to_date) {
            sql += ' AND timestamp <= ?';
            params.push(filters.to_date);
        }

        sql += ' ORDER BY timestamp DESC';

        const result = await this.databaseService.execQuery({ sql, params });
        return result.rows.map((row: any) => ({
            log_id: String(row.log_id),
            user_id: row.user_id,
            action: row.action,
            resource_type: row.resource_type,
            resource_id: row.resource_id,
            timestamp: row.timestamp,
        }));
    }
}

