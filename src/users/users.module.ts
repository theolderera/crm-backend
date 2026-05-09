import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Group } from '../groups/group.entity';
import { Student } from '../students/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group, Student])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
