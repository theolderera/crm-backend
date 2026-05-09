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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const upsert_attendance_dto_1 = require("./dto/upsert-attendance.dto");
const bulk_attendance_dto_1 = require("./dto/bulk-attendance.dto");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    getWeekly(groupId, weekStart) {
        return this.attendanceService.getWeeklyAttendance(groupId, weekStart);
    }
    upsert(dto) {
        return this.attendanceService.upsert(dto);
    }
    bulkUpsert(dto) {
        return this.attendanceService.bulkUpsert(dto);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)('weekly'),
    __param(0, (0, common_1.Query)('groupId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('weekStart')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getWeekly", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_attendance_dto_1.UpsertAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "upsert", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_attendance_dto_1.BulkAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulkUpsert", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map