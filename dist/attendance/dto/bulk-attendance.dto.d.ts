declare class AttendanceItem {
    studentId: number;
    present: boolean;
}
export declare class BulkAttendanceDto {
    date: string;
    records: AttendanceItem[];
}
export {};
