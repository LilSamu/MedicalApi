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

    async create(log: AuditLog): Promise<AuditLog> {
        await this.databaseService.execQuery({
            sql: 'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, timestamp) VALUES (?, ?, ?, ?, ?)',
            params: [log.user_id, log.action, log.resource_type, log.resource_id, log.timestamp],
        });
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM audit_logs ORDER BY id DESC LIMIT 1',
            params: [],
        });
        return result.rows[0] as AuditLog;
    }
}
 

