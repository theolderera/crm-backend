"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_entity_1 = require("./attendance.entity");
let AttendanceService = class AttendanceService {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async getWeeklyAttendance(groupId, weekStart) {
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
    async upsert(dto) {
        await this.attendanceRepo.upsert({ studentId: dto.studentId, date: dto.date, present: dto.present }, ['studentId', 'date']);
        return this.attendanceRepo.findOne({
            where: { studentId: dto.studentId, date: dto.date },
        });
    }
    async bulkUpsert(dto) {
        if (!dto.records.length)
            return;
        await this.attendanceRepo.upsert(dto.records.map((r) => ({
            studentId: r.studentId,
            date: dto.date,
            present: r.present,
        })), ['studentId', 'date']);
    }
    toDateStr(date) {
        return date.toISOString().split('T')[0];
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map