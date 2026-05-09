import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async findAll(): Promise<Student[]> {
    return this.studentRepo.find({
      relations: ['group'],
      order: { firstName: 'ASC' },
    });
  }

  async findByGroup(groupId: number): Promise<Student[]> {
    return this.studentRepo.find({
      where: { groupId },
      order: { firstName: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['group'],
    });
    if (!student) throw new NotFoundException(`Student #${id} not found`);
    return student;
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    const student = this.studentRepo.create(dto);
    return this.studentRepo.save(student);
  }

  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    await this.studentRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepo.remove(student);
  }
}
