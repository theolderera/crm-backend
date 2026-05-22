import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsOptional, IsString, Matches } from 'class-validator';

/** Query params for the attendance report endpoints. `from`/`to` are optional —
 *  when omitted the report covers the whole history of the group. */
export class ReportQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  groupId: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}
