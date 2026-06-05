import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { User } from '../users/user.entity';
import { CourseMonth } from './course-month.entity';

@Entity('groups')
@Index(['name', 'mentorId', 'courseMonthId'], { unique: true })
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  mentorId: number;

  @Column({ nullable: true })
  courseMonthId: number;

  @ManyToOne(() => CourseMonth, (cm) => cm.groups, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseMonthId' })
  courseMonth: CourseMonth;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentorId' })
  mentor: User;

  @Column({ nullable: true })
  teacherId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column({ nullable: true })
  teacher2Id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher2Id' })
  teacher2: User;

  @OneToMany(() => Student, (student) => student.group, { cascade: true })
  students: Student[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
