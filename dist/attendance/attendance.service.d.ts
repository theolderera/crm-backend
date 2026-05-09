import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
export declare class AttendanceService {
    private readonly attendanceRepo;
    constructor(attendanceRepo: Repository<Attendance>);
    getWeeklyAttendance(groupId: number, weekStart: string): Promise<Attendance[]>;
    upsert(dto: UpsertAttendanceDto): Promise<Attendance>;
    bulkUpsert(dto: BulkAttendanceDto): Promise<void>;
    private toDateStr;
}
