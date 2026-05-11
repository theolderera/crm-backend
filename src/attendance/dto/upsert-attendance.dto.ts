import { IsInt, IsPositive, IsString, IsBoolean, Matches, IsOptional, Min, Max } from 'class-validator';

export class UpsertAttendanceDto {
  @IsInt()
  @IsPositive()
  studentId: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

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
