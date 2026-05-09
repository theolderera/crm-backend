import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(groupId?: string): Promise<import("./student.entity").Student[]>;
    findOne(id: number): Promise<import("./student.entity").Student>;
    create(dto: CreateStudentDto): Promise<import("./student.entity").Student>;
    update(id: number, dto: UpdateStudentDto): Promise<import("./student.entity").Student>;
    remove(id: number): Promise<void>;
}
