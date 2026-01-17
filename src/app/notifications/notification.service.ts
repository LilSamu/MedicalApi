import { Service } from 'typedi';
import { NotificationRepository } from './notification.repository';

interface CreateNotificationData {
    user_id: string;
    type: string;
    message: string;
}

@Service()
export class NotificationService {
    constructor(private readonly repository: NotificationRepository) { }

    async send(data: CreateNotificationData): Promise<{ message: string }> {
        const { user_id, type, message } = data;

        if (!user_id || !type || !message) {
            throw new Error('InvalidInput');
        }

        const userId = parseInt(user_id);
        const userExists = await this.repository.userExists(userId);
        if (!userExists) {
            throw new Error('NotFound');
        }

        await this.repository.create({
            user_id: userId,
            type,
            message,
        });

        return {
            message: 'Notification created',
        };
    }
}
