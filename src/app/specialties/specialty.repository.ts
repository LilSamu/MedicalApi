import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { Specialty } from './specialty.model';

@Service()
export class SpecialtyRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async findAll(): Promise<Specialty[]> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM specialties',
            params: [],
        });
        return result.rows.map((row: any) => ({
            specialty_id: String(row.id),
            name: row.name,
        }));
    }
}
