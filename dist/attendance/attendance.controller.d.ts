import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    getWeekly(groupId: number, weekStart: string): Promise<import("./attendance.entity").Attendance[]>;
    upsert(dto: UpsertAttendanceDto): Promise<import("./attendance.entity").Attendance>;
    bulkUpsert(dto: BulkAttendanceDto): Promise<void>;
}
