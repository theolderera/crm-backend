import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { CourseMonth } from './course-month.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(CourseMonth)
    private readonly courseMonthRepo: Repository<CourseMonth>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(userId: number, role: string): Promise<Group[]> {
    if (role === UserRole.ADMIN) {
      return this.groupRepo.find({ relations: ['students', 'teacher', 'teacher2', 'courseMonth'] });
    }
    return this.groupRepo.find({
      where: [
        { mentorId: userId },
        { teacherId: userId },
        { teacher2Id: userId }
      ],
      relations: ['students', 'teacher', 'teacher2', 'courseMonth'],
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

  async create(dto: CreateGroupDto & { courseMonthId?: number }, mentorId: number): Promise<Group> {
    if (!dto.courseMonthId) {
      throw new ConflictException("Контейнер (Давраи омӯзишӣ) интихоб нашудааст");
    }
    const existing = await this.groupRepo.findOne({ where: { name: dto.name, mentorId, courseMonthId: dto.courseMonthId } });
    if (existing) throw new ConflictException(`Гурӯҳи "${dto.name}" дар ин моҳ аллакай мавҷуд аст`);
    const group = this.groupRepo.create({ ...dto, mentorId });
    return this.groupRepo.save(group);
  }

  async update(id: number, dto: UpdateGroupDto, mentorId: number): Promise<Group> {
    // Only mentors can update their groups, so pass role='MENTOR' to findOne to enforce mentor check
    // Wait, findOne allows both. Let's strictly enforce mentorId here.
    const group = await this.findOne(id, mentorId, UserRole.MENTOR);
    if (group.mentorId !== mentorId) throw new NotFoundException('Гурӯҳ ёфт нашуд');

    if (dto.name && dto.name !== group.name) {
      const existing = await this.groupRepo.findOne({ where: { name: dto.name, mentorId, courseMonthId: group.courseMonthId } });
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

    if (teacher.role === UserRole.USER) {
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
    return this.groupRepo.findOne({ where: { id: groupId }, relations: ['students', 'teacher', 'teacher2', 'courseMonth'] });
  }

  // CourseMonth logic
  async createCourseMonth(mentorId: number): Promise<CourseMonth> {
    const now = new Date();
    let year = now.getFullYear();
    let currentMonth = now.getMonth(); // 0 to 11
    const currentDay = now.getDate();

    // If day < 5, it means it's still part of the PREVIOUS month's cycle
    if (currentDay < 5) {
      currentMonth -= 1;
      if (currentMonth < 0) {
        currentMonth = 11;
        year -= 1;
      }
    }

    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? year + 1 : year;

    // e.g. June 5 to July 3
    const startDate = new Date(year, currentMonth, 5);
    const endDate = new Date(nextYear, nextMonth, 3);

    const monthNames = [
      'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
      'Июл', 'Август', 'Сентябр', 'Октябр', 'Ноябр', 'Декабр'
    ];
    // e.g. "Июн 2026"
    const name = `${monthNames[currentMonth]} ${year}`;

    const existing = await this.courseMonthRepo.findOne({ where: { name, mentorId } });
    if (existing) {
      throw new ConflictException(`Контейнери "${name}" аллакай сохта шудааст.`);
    }

    const cm = this.courseMonthRepo.create({
      name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      mentorId,
    });
    return this.courseMonthRepo.save(cm);
  }

  async migrateOldGroups(userId: number): Promise<{ migrated: number }> {
    // Check if CourseMonth for May 2026 exists
    let cm = await this.courseMonthRepo.findOne({ where: { name: 'Май 2026', mentorId: userId } });
    if (!cm) {
      cm = this.courseMonthRepo.create({
        name: 'Май 2026',
        startDate: '2026-05-05',
        endDate: '2026-06-03',
        mentorId: userId,
      });
      cm = await this.courseMonthRepo.save(cm);
    }

    // Find all groups for this mentor without a courseMonthId
    const groups = await this.groupRepo.find({
      where: { mentorId: userId, courseMonthId: null as any }
    });

    for (const g of groups) {
      g.courseMonthId = cm.id;
      await this.groupRepo.save(g);
    }

    return { migrated: groups.length };
  }

  async getCourseMonths(userId: number, role: string): Promise<CourseMonth[]> {
    if (role !== UserRole.ADMIN) {
      // Auto-migrate any unassigned groups for this mentor before fetching
      const unassignedGroupsCount = await this.groupRepo.count({
        where: { mentorId: userId, courseMonthId: null as any }
      });
      if (unassignedGroupsCount > 0) {
        await this.migrateOldGroups(userId);
      }
    }

    if (role === UserRole.ADMIN) {
      return this.courseMonthRepo.find({
        order: { startDate: 'DESC' },
        relations: ['groups', 'groups.students', 'groups.teacher', 'groups.teacher2'],
      });
    }
    // For mentors, fetch their own months
    return this.courseMonthRepo.find({
      where: { mentorId: userId },
      order: { startDate: 'DESC' },
      relations: ['groups', 'groups.students', 'groups.teacher', 'groups.teacher2'],
    });
  }
}
