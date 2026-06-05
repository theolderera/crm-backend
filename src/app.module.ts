import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GroupsModule } from './groups/groups.module';
import { StudentsModule } from './students/students.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { TicketsModule } from './tickets/tickets.module';
import { Group } from './groups/group.entity';
import { Student } from './students/student.entity';
import { Attendance } from './attendance/attendance.entity';
import { CourseMonth } from './groups/course-month.entity';
import { User } from './users/user.entity';
import { Ticket } from './tickets/ticket.entity';
import { Message } from './tickets/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [Group, Student, Attendance, User, Ticket, Message, CourseMonth],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('DATABASE_NAME') || 'crm.sqlite',
          entities: [Group, Student, Attendance, User, Ticket, Message, CourseMonth],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    MailModule,
    GroupsModule,
    StudentsModule,
    AttendanceModule,
    ReportsModule,
    TicketsModule,
  ],
})
export class AppModule {}
