import { Service } from 'typedi';
import { AdminRepository } from './admin.repository';
import { AuditLogRepository } from '../audit-logs/audit-log.repository';

@Service()
export class AdminService {
    constructor(
        private readonly repository: AdminRepository,
        private readonly auditLogRepository: AuditLogRepository,
    ) { }

    async searchUsers(filters: { role?: string; name?: string; email?: string }, requesterRole: string): Promise<any[]> {
        if (requesterRole !== 'admin') {
            throw new Error('Unauthorized');
        }
        return this.repository.searchUsers(filters);
    }

    async searchMedicalRecords(filters: { patient_id?: string; doctor_id?: string; from_date?: string; to_date?: string }, requesterRole: string): Promise<any[]> {
        if (requesterRole !== 'admin') {
            throw new Error('Unauthorized');
        }
        return this.repository.searchMedicalRecords(filters);
    }

    async getAuditLogs(filters: { user_id?: string; action?: string; from_date?: string; to_date?: string }, requesterRole: string): Promise<any[]> {
        if (requesterRole !== 'admin') {
            throw new Error('Unauthorized');
        }
        return this.auditLogRepository.findAll(filters);
    }
}
