import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Profile endpoints (all authenticated users) ───

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('profile/password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto.oldPassword, dto.newPassword);
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Request() req: any, @UploadedFile() file: any) {
    if (!file) throw new Error('Файл ёфт нашуд');
    return this.usersService.updateAvatar(req.user.id, file.filename);
  }

  // ─── Admin-only endpoints ───

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MENTOR')
  searchPending(@Request() req: any) {
    const q = req.query.q as string;
    return this.usersService.searchPendingUsers(q);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneDetailed(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.usersService.deleteUser(id, req.user.id);
  }

  // Admin: All groups across all mentors
  @Get('admin/groups')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAllGroups() {
    return this.usersService.findAllGroups();
  }

  // Admin: All students
  @Get('admin/students')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAllStudents() {
    return this.usersService.findAllStudents();
  }

  // Admin: Delete a student
  @Delete('admin/students/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deleteStudent(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteStudent(id);
  }

  // Admin: Delete a group
  @Delete('admin/groups/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deleteGroup(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteGroup(id);
  }
}
