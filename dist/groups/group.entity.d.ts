import { Student } from '../students/student.entity';
export declare class Group {
    id: number;
    name: string;
    description: string;
    students: Student[];
    createdAt: Date;
    updatedAt: Date;
}
