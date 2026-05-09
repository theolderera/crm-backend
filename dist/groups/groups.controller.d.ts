import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    findAll(): Promise<import("./group.entity").Group[]>;
    findOne(id: number): Promise<import("./group.entity").Group>;
    create(dto: CreateGroupDto): Promise<import("./group.entity").Group>;
    update(id: number, dto: UpdateGroupDto): Promise<import("./group.entity").Group>;
    remove(id: number): Promise<void>;
}
