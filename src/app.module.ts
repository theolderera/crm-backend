import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GroupsModule } from './groups/groups.module';
import { StudentsModule } from './students/students.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { Group } from './groups/group.entity';
import { Student } from './students/student.entity';
import { Attendance } from './attendance/attendance.entity';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'crm.sqlite',
      entities: [Group, Student, Attendance, User],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    MailModule,
    GroupsModule,
    StudentsModule,
    AttendanceModule,
  ],
})
export class AppModule {}
