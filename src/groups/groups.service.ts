import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  async findAll(mentorId: number): Promise<Group[]> {
    return this.groupRepo.find({
      where: { mentorId },
      relations: ['students'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number, mentorId: number): Promise<Group> {
    const group = await this.groupRepo.findOne({
      where: { id, mentorId },
      relations: ['students'],
    });
    if (!group) throw new NotFoundException(`Гурӯҳ #${id} ёфт нашуд`);
    return group;
  }

  async create(dto: CreateGroupDto, mentorId: number): Promise<Group> {
    const existing = await this.groupRepo.findOne({ where: { name: dto.name, mentorId } });
    if (existing) throw new ConflictException(`Гурӯҳи "${dto.name}" аллакай мавҷуд аст`);
    const group = this.groupRepo.create({ ...dto, mentorId });
    return this.groupRepo.save(group);
  }

  async update(id: number, dto: UpdateGroupDto, mentorId: number): Promise<Group> {
    const group = await this.findOne(id, mentorId);
    if (dto.name && dto.name !== group.name) {
      const existing = await this.groupRepo.findOne({ where: { name: dto.name, mentorId } });
      if (existing) throw new ConflictException(`Гурӯҳи "${dto.name}" аллакай мавҷуд аст`);
    }
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async remove(id: number, mentorId: number): Promise<void> {
    const group = await this.findOne(id, mentorId);
    await this.groupRepo.remove(group);
  }
}
