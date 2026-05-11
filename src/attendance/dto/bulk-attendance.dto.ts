import { IsArray, ValidateNested, IsInt, IsPositive, IsString, IsBoolean, Matches, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceItem {
  @IsInt()
  @IsPositive()
  studentId: number;

  @IsBoolean()
  present: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  lateMinutes?: number | null;

  @IsOptional()
  @IsString()
  lateNote?: string | null;
}

export class BulkAttendanceDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItem)
  records: AttendanceItem[];
}
