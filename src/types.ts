export interface Course {
  id: string;
  year: string;
  division: string;
  specialty: string;
}

export interface Student {
  id: string;
  lastname: string;
  name: string;
  course?: string;
}

export interface AttendanceRecord {
  id: string;
  student: string;
  presence: string;
  date: string;
  lastname?: string;
  name?: string;
}

export interface AccountResponse {
  ok?: boolean;
  user?: string;
  message?: string;
  error?: string;
}
