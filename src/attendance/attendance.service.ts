import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async getWeeklyAttendance(groupId: number, weekStart: string): Promise<Attendance[]> {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return this.attendanceRepo
      .createQueryBuilder('attendance')
      .innerJoin('attendance.student', 'student')
      .where('student.groupId = :groupId', { groupId })
      .andWhere('attendance.date >= :start', { start: this.toDateStr(start) })
      .andWhere('attendance.date <= :end', { end: this.toDateStr(end) })
      .getMany();
  }

  async upsert(dto: UpsertAttendanceDto): Promise<Attendance> {
    const existing = await this.attendanceRepo.findOne({
      where: { studentId: dto.studentId, date: dto.date },
    });
    if (existing) {
      existing.present = dto.present;
      return this.attendanceRepo.save(existing);
    }
    return this.attendanceRepo.save(this.attendanceRepo.create(dto));
  }

  async bulkUpsert(dto: BulkAttendanceDto): Promise<void> {
    if (!dto.records.length) return;
    await this.attendanceRepo.upsert(
      dto.records.map((r) => ({
        studentId: r.studentId,
        date: dto.date,
        present: r.present,
      })),
      ['studentId', 'date'],
    );
  }

  private toDateStr(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
