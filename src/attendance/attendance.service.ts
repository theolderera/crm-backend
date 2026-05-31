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
      existing.lateMinutes = dto.lateMinutes ?? null;
      existing.lateNote = dto.lateNote ?? null;
      existing.excused = dto.excused ?? false;
      existing.excusedReason = dto.excusedReason ?? null;
      existing.hwSolved = dto.hwSolved ?? null;
      return this.attendanceRepo.save(existing);
    }
    return this.attendanceRepo.save(
      this.attendanceRepo.create({
        studentId: dto.studentId,
        date: dto.date,
        present: dto.present,
        lateMinutes: dto.lateMinutes ?? null,
        lateNote: dto.lateNote ?? null,
        excused: dto.excused ?? false,
        excusedReason: dto.excusedReason ?? null,
        hwSolved: dto.hwSolved ?? null,
      }),
    );
  }

  async bulkUpsert(dto: BulkAttendanceDto): Promise<void> {
    if (!dto.records.length) return;
    // Use manual upsert to handle lateMinutes and lateNote
    for (const r of dto.records) {
      await this.upsert({
        studentId: r.studentId,
        date: dto.date,
        present: r.present,
        lateMinutes: r.lateMinutes ?? null,
        lateNote: r.lateNote ?? null,
        excused: r.excused ?? false,
        excusedReason: r.excusedReason ?? null,
        hwSolved: r.hwSolved ?? null,
      });
    }
  }

  private toDateStr(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
