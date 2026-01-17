export interface Notification {
    id?: number;
    user_id: number;
    type: string;
    message: string;
    created_at?: string;
}
