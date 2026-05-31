import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { buildAttendanceDocx } from './reports.docx';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MENTOR', 'TEACHER', 'ADMIN')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Aggregated attendance report as JSON — used for the on-screen preview. */
  @Get('attendance')
  getAttendance(@Query() query: ReportQueryDto, @Request() req: any) {
    return this.reportsService.buildReport(query, req.user.id, req.user.role);
  }

  /** The same report rendered as a downloadable Word (.docx) document. */
  @Get('attendance/docx')
  async getAttendanceDocx(
    @Query() query: ReportQueryDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.buildReport(
      query,
      req.user.id,
      req.user.role,
    );
    const buffer = await buildAttendanceDocx(report);

    const encodedName = encodeURIComponent(
      `Ҳисобот - ${report.group.name}.docx`,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="attendance-report.docx"; filename*=UTF-8''${encodedName}`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
