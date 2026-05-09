import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Group } from '../groups/group.entity';
import { Student } from '../students/student.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async findAll() {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ password, verificationCode, ...u }) => u);
  }

  /** Get single user with their groups and students */
  async findOneDetailed(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Истифодабаранда ёфт нашуд');

    const groups = await this.groupRepo.find({
      where: { mentorId: id },
      relations: ['students'],
      order: { createdAt: 'ASC' },
    });

    const { password, verificationCode, ...rest } = user;
    return { ...rest, groups };
  }

  async updateRole(id: number, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Истифодабаранда ёфт нашуд');
    user.role = role;
    await this.userRepo.save(user);
    const { password, verificationCode, ...rest } = user;
    return rest;
  }

  async deleteUser(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException('Шумо худро нест карда наметавонед');
    }
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Истифодабаранда ёфт нашуд');
    await this.userRepo.remove(user);
    return { success: true };
  }

  /** Admin: get ALL groups (across all mentors) */
  async findAllGroups() {
    return this.groupRepo.find({
      relations: ['students', 'mentor'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Admin: get ALL students */
  async findAllStudents() {
    return this.studentRepo.find({
      relations: ['group'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Admin: delete student */
  async deleteStudent(id: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Донишҷӯ ёфт нашуд');
    await this.studentRepo.remove(student);
    return { success: true };
  }

  /** Admin: delete group */
  async deleteGroup(id: number) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Гурӯҳ ёфт нашуд');
    await this.groupRepo.remove(group);
    return { success: true };
  }
}
