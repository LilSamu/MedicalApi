import { Service } from 'typedi';
import { DatabaseService } from '../../database/database.service';
import { Department } from './department.model';

@Service()
export class DepartmentRepository {
    constructor(private readonly databaseService: DatabaseService) { }

    async findAll(): Promise<Department[]> {
        const result = await this.databaseService.execQuery({
            sql: 'SELECT * FROM departments',
            params: [],
        });
        return result.rows as Department[];
    }
}
