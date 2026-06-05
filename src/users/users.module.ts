import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Group } from '../groups/group.entity';
import { Student } from '../students/student.entity';
import { Attendance } from '../attendance/attendance.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, Student, Attendance]),
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new Error('Танҳо суратҳои JPG, PNG ва WebP қабул мешаванд'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
