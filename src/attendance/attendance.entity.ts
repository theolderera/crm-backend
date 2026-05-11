import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from '../students/student.entity';

@Entity('attendance')
@Unique(['studentId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, (student) => student.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @Column({ type: 'varchar' })
  date: string;

  @Column({ type: 'boolean', default: false })
  present: boolean;

  @Column({ type: 'integer', nullable: true, default: null })
  lateMinutes: number | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  lateNote: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
