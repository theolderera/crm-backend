import { IsString, IsOptional, IsInt, IsPositive, MaxLength } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string | null;

  @IsInt()
  @IsPositive()
  @IsOptional()
  groupId?: number;
}
