import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { Notification } from './notification.model';

@Service()
export class NotificationRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async create(notification: Notification): Promise<Notification> {
        await this.databaseService.execQuery({
            sql: 'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
            params: [notification.user_id, notification.type, notification.message],
        });
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM notifications ORDER BY id DESC LIMIT 1',
            params: [],
        });
        return result.rows[0] as Notification;
    }

    async userExists(userId: number): Promise<boolean> {
    
        let result = await this.databaseService.execQuery({
            sql: 'SELECT id FROM patients WHERE id = ?',
            params: [userId],
        });
        if (result.rows.length > 0) return true;

        result = await this.databaseService.execQuery({
            sql: 'SELECT id FROM doctors WHERE id = ?',
            params: [userId],
        });
        if (result.rows.length > 0) return true;

        result = await this.databaseService.execQuery({
            sql: 'SELECT id FROM admins WHERE id = ?',
            params: [userId],
        });
        return result.rows.length > 0;
    }
}
