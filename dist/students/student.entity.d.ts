import { Group } from '../groups/group.entity';
import { Attendance } from '../attendance/attendance.entity';
export declare class Student {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    group: Group;
    groupId: number;
    attendances: Attendance[];
    createdAt: Date;
    updatedAt: Date;
}
