import { Student } from '../students/student.entity';
export declare class Attendance {
    id: number;
    student: Student;
    studentId: number;
    date: string;
    present: boolean;
    createdAt: Date;
}
