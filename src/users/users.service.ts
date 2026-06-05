import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Group } from '../groups/group.entity';
import { Student } from '../students/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async findAll() {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ password, verificationCode, ...u }) => u);
  }

  /** Search for users to assign as main teacher (PENDING or TEACHER) */
  async searchPendingUsers(q: string) {
    if (!q || q.length < 2) return [];
    
    const queryBuilder = this.userRepo.createQueryBuilder('user')
      .where('(user.role = :pending OR user.role = :teacher)', { 
        pending: UserRole.USER, 
        teacher: UserRole.TEACHER 
      })
      .andWhere(
        '(LOWER(user.firstName) LIKE LOWER(:q) OR LOWER(user.lastName) LIKE LOWER(:q) OR user.phone LIKE :q OR LOWER(user.email) LIKE LOWER(:q))',
        { q: `%${q}%` }
      )
      .take(10);
      
    const users = await queryBuilder.getMany();
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

  /** Get profile with stats */
  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Корбар ёфт нашуд');

    const { password, verificationCode, ...userData } = user;

    // Get groups where user is mentor
    const mentorGroups = await this.groupRepo.find({
      where: { mentorId: userId },
      relations: ['students'],
    });

    // Get groups where user is teacher
    const teacherGroups = await this.groupRepo
      .createQueryBuilder('g')
      .where('g.teacherId = :uid OR g.teacher2Id = :uid', { uid: userId })
      .leftJoinAndSelect('g.students', 'students')
      .getMany();

    const allGroups = [...mentorGroups, ...teacherGroups];
    const totalStudents = allGroups.reduce((acc, g) => acc + (g.students?.length || 0), 0);

    // Calculate average attendance
    let avgAttendance = 0;
    if (totalStudents > 0) {
      const studentIds = allGroups.flatMap(g => (g.students || []).map(s => s.id));
      if (studentIds.length > 0) {
        const totalRecords = await this.attendanceRepo
          .createQueryBuilder('a')
          .where('a.studentId IN (:...ids)', { ids: studentIds })
          .getCount();
        const presentRecords = await this.attendanceRepo
          .createQueryBuilder('a')
          .where('a.studentId IN (:...ids)', { ids: studentIds })
          .andWhere('a.present = :present', { present: true })
          .getCount();
        avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
      }
    }

    return {
      ...userData,
      stats: {
        totalGroups: allGroups.length,
        mentorGroups: mentorGroups.length,
        teacherGroups: teacherGroups.length,
        totalStudents,
        avgAttendance,
      },
    };
  }

  /** Update profile fields */
  async updateProfile(userId: number, data: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Корбар ёфт нашуд');

    // Check phone uniqueness if changing
    if (data.phone && data.phone !== user.phone) {
      const existing = await this.userRepo.findOne({ where: { phone: data.phone } });
      if (existing) throw new BadRequestException('Ин рақам аллакай истифода мешавад');
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone) user.phone = data.phone;

    await this.userRepo.save(user);
    const { password, verificationCode, ...rest } = user;
    return rest;
  }

  /** Change password */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Корбар ёфт нашуд');

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new BadRequestException('Рамзи кунунӣ нодуруст аст');

    if (newPassword.length < 6) {
      throw new BadRequestException('Рамзи нав бояд ҳадди ақал 6 аломат бошад');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { success: true, message: 'Рамз бомуваффақият иваз шуд' };
  }

  /** Update avatar */
  async updateAvatar(userId: number, filename: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Корбар ёфт нашуд');

    user.avatar = filename;
    await this.userRepo.save(user);
    const { password, verificationCode, ...rest } = user;
    return rest;
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
