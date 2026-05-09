import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
export declare class GroupsService {
    private readonly groupRepo;
    constructor(groupRepo: Repository<Group>);
    findAll(): Promise<Group[]>;
    findOne(id: number): Promise<Group>;
    create(dto: CreateGroupDto): Promise<Group>;
    update(id: number, dto: UpdateGroupDto): Promise<Group>;
    remove(id: number): Promise<void>;
}
