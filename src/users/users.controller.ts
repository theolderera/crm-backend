import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneDetailed(id);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Delete(':id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.usersService.deleteUser(id, req.user.id);
  }

  // Admin: All groups across all mentors
  @Get('admin/groups')
  findAllGroups() {
    return this.usersService.findAllGroups();
  }

  // Admin: All students
  @Get('admin/students')
  findAllStudents() {
    return this.usersService.findAllStudents();
  }

  // Admin: Delete a student
  @Delete('admin/students/:id')
  deleteStudent(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteStudent(id);
  }

  // Admin: Delete a group
  @Delete('admin/groups/:id')
  deleteGroup(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteGroup(id);
  }
}
