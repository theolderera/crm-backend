import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Group } from './group.entity';

@Entity()
export class CourseMonth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column()
  mentorId: number;

  @ManyToOne(() => User)
  mentor: User;

  @OneToMany(() => Group, (group) => group.courseMonth)
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;
}
