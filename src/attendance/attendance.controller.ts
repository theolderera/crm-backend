import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MENTOR', 'ADMIN')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('weekly')
  getWeekly(
    @Query('groupId', ParseIntPipe) groupId: number,
    @Query('weekStart') weekStart: string,
  ) {
    return this.attendanceService.getWeeklyAttendance(groupId, weekStart);
  }

  @Post()
  upsert(@Body() dto: UpsertAttendanceDto) {
    return this.attendanceService.upsert(dto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  bulkUpsert(@Body() dto: BulkAttendanceDto) {
    return this.attendanceService.bulkUpsert(dto);
  }
}
