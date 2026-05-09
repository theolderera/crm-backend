"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const group_entity_1 = require("./group.entity");
let GroupsService = class GroupsService {
    constructor(groupRepo) {
        this.groupRepo = groupRepo;
    }
    async findAll() {
        return this.groupRepo.find({
            relations: ['students'],
            order: { createdAt: 'ASC' },
        });
    }
    async findOne(id) {
        const group = await this.groupRepo.findOne({
            where: { id },
            relations: ['students'],
        });
        if (!group)
            throw new common_1.NotFoundException(`Group #${id} not found`);
        return group;
    }
    async create(dto) {
        const existing = await this.groupRepo.findOne({ where: { name: dto.name } });
        if (existing)
            throw new common_1.ConflictException(`Group "${dto.name}" already exists`);
        const group = this.groupRepo.create(dto);
        return this.groupRepo.save(group);
    }
    async update(id, dto) {
        const group = await this.findOne(id);
        if (dto.name && dto.name !== group.name) {
            const existing = await this.groupRepo.findOne({ where: { name: dto.name } });
            if (existing)
                throw new common_1.ConflictException(`Group "${dto.name}" already exists`);
        }
        Object.assign(group, dto);
        return this.groupRepo.save(group);
    }
    async remove(id) {
        const group = await this.findOne(id);
        await this.groupRepo.remove(group);
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GroupsService);
//# sourceMappingURL=groups.service.js.map