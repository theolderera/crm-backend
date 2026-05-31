import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MENTOR', 'TEACHER', 'ADMIN')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.groupsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.groupsService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles('MENTOR', 'ADMIN')
  create(@Body() dto: CreateGroupDto, @Request() req: any) {
    return this.groupsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('MENTOR', 'ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
    @Request() req: any,
  ) {
    return this.groupsService.update(id, dto, req.user.id);
  }

  @Patch(':id/teacher')
  @Roles('MENTOR', 'ADMIN')
  assignTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body('teacherId') teacherId: number,
    @Request() req: any,
  ) {
    return this.groupsService.assignTeacher(id, teacherId, req.user.id, req.user.role);
  }

  @Delete(':id/teacher/:teacherId')
  @Roles('MENTOR', 'ADMIN')
  unassignTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Request() req: any,
  ) {
    return this.groupsService.unassignTeacher(id, teacherId, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles('MENTOR', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.groupsService.remove(id, req.user.id);
  }
}
