import { IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
