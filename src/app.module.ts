import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [Group, Student, Attendance, User],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'better-sqlite3' as const,
          database: config.get<string>('DATABASE_NAME') || 'crm.sqlite',
          entities: [Group, Student, Attendance, User],
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
  ],
})
export class AppModule {}
