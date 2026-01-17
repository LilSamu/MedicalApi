import { Service } from 'typedi';
import { DepartmentRepository } from './department.repository';
import { Department } from './department.model';

@Service()
export class DepartmentService {
    constructor(private readonly repository: DepartmentRepository) { }

    async findAll(): Promise<Department[]> {
        return this.repository.findAll();
    }
}
