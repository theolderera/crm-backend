import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './users/user.entity';
import { Group } from './groups/group.entity';
import { Student } from './students/student.entity';
import { Attendance } from './attendance/attendance.entity';

const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'crm.sqlite',
  entities: [User, Group, Student, Attendance],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const exists = await userRepo.findOne({ where: { role: UserRole.ADMIN } });
  if (exists) {
    console.log('Admin already exists:', exists.email);
    await AppDataSource.destroy();
    return;
  }

  const password = await bcrypt.hash('admin123', 10);
  const admin = userRepo.create({
    firstName: 'Admin',
    lastName: 'CRM',
    email: 'admin@crm.com',
    phone: '+992000000000',
    password,
    role: UserRole.ADMIN,
  });
  await userRepo.save(admin);
  console.log('✅ Admin created:');
  console.log('   Email   : admin@crm.com');
  console.log('   Phone   : +992000000000');
  console.log('   Password: admin123');
  await AppDataSource.destroy();
}

seed().catch(console.error);
