import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(userId: number, role: string): Promise<Group[]> {
    if (role === UserRole.ADMIN) {
      return this.groupRepo.find({ relations: ['students', 'teacher', 'teacher2'] });
    }
    return this.groupRepo.find({
      where: [
        { mentorId: userId },
        { teacherId: userId },
        { teacher2Id: userId }
      ],
      relations: ['students', 'teacher', 'teacher2'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number, userId: number, role: string): Promise<Group> {
    const whereClause: any = { id };
    if (role !== UserRole.ADMIN) {
      whereClause.mentorId = userId; // fallback, we'll check properly below
    }
    
    const group = await this.groupRepo.findOne({
      where: { id },
      relations: ['students', 'teacher', 'teacher2'],
    });

    if (!group) throw new NotFoundException(`Гурӯҳ #${id} ёфт нашуд`);
    
    if (role !== UserRole.ADMIN && group.mentorId !== userId && group.teacherId !== userId && group.teacher2Id !== userId) {
      throw new NotFoundException(`Гурӯҳ #${id} ёфт нашуд`);
    }

    return group;
  }

  async create(dto: CreateGroupDto, mentorId: number): Promise<Group> {
    const existing = await this.groupRepo.findOne({ where: { name: dto.name, mentorId } });
    if (existing) throw new ConflictException(`Гурӯҳи "${dto.name}" аллакай мавҷуд аст`);
    const group = this.groupRepo.create({ ...dto, mentorId });
    return this.groupRepo.save(group);
  }

  async update(id: number, dto: UpdateGroupDto, mentorId: number): Promise<Group> {
    // Only mentors can update their groups, so pass role='MENTOR' to findOne to enforce mentor check
    // Wait, findOne allows both. Let's strictly enforce mentorId here.
    const group = await this.findOne(id, mentorId, UserRole.MENTOR);
    if (group.mentorId !== mentorId) throw new NotFoundException('Гурӯҳ ёфт нашуд');

    if (dto.name && dto.name !== group.name) {
      const existing = await this.groupRepo.findOne({ where: { name: dto.name, mentorId } });
      if (existing) throw new ConflictException(`Гурӯҳи "${dto.name}" аллакай мавҷуд аст`);
    }
    Object.assign(group, dto);
    return this.groupRepo.save(group);
  }

  async remove(id: number, mentorId: number): Promise<void> {
    const group = await this.findOne(id, mentorId, UserRole.MENTOR);
    if (group.mentorId !== mentorId) throw new NotFoundException('Гурӯҳ ёфт нашуд');
    await this.groupRepo.remove(group);
  }

  async assignTeacher(groupId: number, teacherId: number, currentUserId: number, currentUserRole: string): Promise<Group> {
    // If Admin, they can assign to any group. If Mentor, only their own groups.
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Гурӯҳ ёфт нашуд');
    
    if (currentUserRole !== 'ADMIN' && group.mentorId !== currentUserId) {
      throw new ConflictException('Шумо танҳо ба гурӯҳҳои худ муаллим вобаста карда метавонед');
    }

    if (group.teacherId && group.teacher2Id) {
      throw new ConflictException('Ин гурӯҳ аллакай 2 муаллим дорад');
    }
    if (group.teacherId === teacherId || group.teacher2Id === teacherId) {
      throw new ConflictException('Ин муаллим аллакай ба ин гурӯҳ вобаста шудааст');
    }

    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Муаллим ёфт нашуд');

    if (!group.teacherId) {
      group.teacherId = teacher.id;
    } else {
      group.teacher2Id = teacher.id;
    }

    await this.groupRepo.save(group);

    if (teacher.role === UserRole.PENDING) {
      teacher.role = UserRole.TEACHER;
      await this.userRepo.save(teacher);
    }

    return this.groupRepo.findOne({ where: { id: groupId }, relations: ['students', 'teacher', 'teacher2'] });
  }

  async unassignTeacher(groupId: number, teacherId: number, currentUserId: number, currentUserRole: string): Promise<Group> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Гурӯҳ ёфт нашуд');
    
    if (currentUserRole !== 'ADMIN' && group.mentorId !== currentUserId) {
      throw new ConflictException('Шумо танҳо ба гурӯҳҳои худ муаллимро ҳазф карда метавонед');
    }

    if (group.teacherId === teacherId) {
      group.teacherId = null;
    } else if (group.teacher2Id === teacherId) {
      group.teacher2Id = null;
    } else {
      throw new NotFoundException('Ин муаллим дар ин гурӯҳ нест');
    }

    await this.groupRepo.save(group);
    return this.groupRepo.findOne({ where: { id: groupId }, relations: ['students', 'teacher', 'teacher2'] });
  }
}
