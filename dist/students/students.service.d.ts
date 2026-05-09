import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsService {
    private readonly studentRepo;
    constructor(studentRepo: Repository<Student>);
    findAll(): Promise<Student[]>;
    findByGroup(groupId: number): Promise<Student[]>;
    findOne(id: number): Promise<Student>;
    create(dto: CreateStudentDto): Promise<Student>;
    update(id: number, dto: UpdateStudentDto): Promise<Student>;
    remove(id: number): Promise<void>;
}
