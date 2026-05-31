import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../groups/group.entity';
import { Attendance } from '../attendance/attendance.entity';
import { ReportQueryDto } from './dto/report-query.dto';

/** Per-student aggregated attendance figures for the report. */
export interface StudentReportRow {
  id: number;
  name: string;
  phone: string | null;
  sessions: number;
  present: number;
  absent: number;
  late: number;
  lateMinutes: number;
  excused: number;
  hwSolved: number;
  /** Attendance percentage, 0–100 (rounded). */
  rate: number;
}

/** The full attendance report payload shared by the JSON and DOCX endpoints. */
export interface AttendanceReport {
  group: { id: number; name: string; description: string | null };
  mentor: string | null;
  /** The period that was requested (null = unbounded). */
  period: { from: string | null; to: string | null };
  /** First / last date that actually has recorded sessions in range. */
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedAt: string;
  summary: {
    totalStudents: number;
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    lateMinutes: number;
    excused: number;
    hwSolved: number;
    /** Average attendance across the whole group, 0–100. */
    avgRate: number;
  };
  students: StudentReportRow[];
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  /**
   * Builds the attendance report for a group within an optional date range.
   * A "session" is any calendar date on which at least one student of the
   * group has an attendance record — a student with no record on a session
   * day counts as absent, mirroring the attendance grid behaviour.
   */
  /** Ensures a `yyyy-MM-dd` string is a real calendar date (rejects 2026-13-99,
   *  2026-02-30, etc. — the shape is already checked by the DTO regex). */
  private assertValidDate(value: string | undefined, label: string): void {
    if (!value) return;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`Санаи «${label}» нодуруст аст`);
    }
  }

  async buildReport(
    query: ReportQueryDto,
    userId: number,
    role: string,
  ): Promise<AttendanceReport> {
    this.assertValidDate(query.from, 'аз');
    this.assertValidDate(query.to, 'то');

    const group = await this.groupRepo.findOne({
      where: { id: query.groupId },
      relations: ['students', 'mentor'],
    });
    if (!group) {
      throw new NotFoundException(`Гурӯҳ #${query.groupId} ёфт нашуд`);
    }
    if (role !== 'ADMIN' && group.mentorId !== userId) {
      throw new ForbiddenException('Шумо ба ин гурӯҳ дастрасӣ надоред');
    }

    const students = [...(group.students ?? [])].sort((a, b) =>
      (a.firstName ?? '').localeCompare(b.firstName ?? '', 'ru'),
    );

    // Load attendance records for these students within the requested range.
    let records: Attendance[] = [];
    if (students.length) {
      const qb = this.attendanceRepo
        .createQueryBuilder('a')
        .where('a.studentId IN (:...ids)', { ids: students.map((s) => s.id) });
      if (query.from) qb.andWhere('a.date >= :from', { from: query.from });
      if (query.to) qb.andWhere('a.date <= :to', { to: query.to });
      records = await qb.getMany();
    }

    // Distinct session dates (sorted ascending).
    const sessionDates = [...new Set(records.map((r) => r.date))].sort();
    const totalSessions = sessionDates.length;

    // Fast lookup by `${studentId}_${date}`.
    const recMap = new Map<string, Attendance>();
    records.forEach((r) => recMap.set(`${r.studentId}_${r.date}`, r));

    const rows: StudentReportRow[] = students.map((s) => {
      let present = 0;
      let late = 0;
      let lateMinutes = 0;
      let excused = 0;
      let hwSolved = 0;
      for (const date of sessionDates) {
        const rec = recMap.get(`${s.id}_${date}`);
        if (rec) {
          if (rec.present) {
            present++;
            if (rec.lateMinutes != null && rec.lateMinutes > 0) {
              late++;
              lateMinutes += rec.lateMinutes;
            }
          } else if (rec.excused) {
            excused++;
          }
          if (rec.hwSolved != null && rec.hwSolved > 0) {
            hwSolved += rec.hwSolved;
          }
        }
      }
      const absent = totalSessions - present - excused;
      const rate =
        totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
      return {
        id: s.id,
        name: [s.firstName, s.lastName].filter(Boolean).join(' '),
        phone: s.phone || null,
        sessions: totalSessions,
        present,
        absent,
        late,
        lateMinutes,
        excused,
        hwSolved,
        rate,
      };
    });

    const present = rows.reduce((a, r) => a + r.present, 0);
    const absent = rows.reduce((a, r) => a + r.absent, 0);
    const late = rows.reduce((a, r) => a + r.late, 0);
    const lateMinutes = rows.reduce((a, r) => a + r.lateMinutes, 0);
    const excused = rows.reduce((a, r) => a + r.excused, 0);
    const hwSolved = rows.reduce((a, r) => a + r.hwSolved, 0);
    const denominator = rows.length * totalSessions;
    const avgRate =
      denominator > 0 ? Math.round((present / denominator) * 100) : 0;

    const mentor = group.mentor
      ? [group.mentor.firstName, group.mentor.lastName]
          .filter(Boolean)
          .join(' ')
      : null;

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description || null,
      },
      mentor,
      period: { from: query.from ?? null, to: query.to ?? null },
      rangeStart: sessionDates[0] ?? null,
      rangeEnd: sessionDates[sessionDates.length - 1] ?? null,
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents: rows.length,
        totalSessions,
        present,
        absent,
        late,
        lateMinutes,
        excused,
        hwSolved,
        avgRate,
      },
      students: rows,
    };
  }
}
