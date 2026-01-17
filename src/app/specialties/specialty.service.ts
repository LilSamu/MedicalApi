import { Service } from 'typedi';
import { SpecialtyRepository } from './specialty.repository';
import { Specialty } from './specialty.model';

@Service()
export class SpecialtyService {
    constructor(private readonly repository: SpecialtyRepository) { }

    async findAll(): Promise<Specialty[]> {
        return this.repository.findAll();
    }
}
