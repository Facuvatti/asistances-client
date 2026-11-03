export type Role = 'admin' | 'preceptor' | 'profesor' | 'estudiante' | 'padre';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  preceptor: 'Preceptor',
  profesor: 'Profesor',
  estudiante: 'Alumno',
  padre: 'Padre',
};

export type Presence = 'P' | 'T' | 'A' | 'RA';
export const PRESENCES: Presence[] = ['P', 'T', 'A', 'RA'];
export const PRESENCE_LABELS: Record<Presence, string> = {
  P: 'Presente',
  T: 'Tarde',
  A: 'Ausente',
  RA: 'Retiro anticipado',
};

export interface Course {
  id: number;
  year: number;
  division: number;
  specialty: string;
}

export interface Subject {
  id: number;
  name: string;
  hours: number | null;
  course: number;
  teacher: string;
  teacher_name: string;
  year: number;
  division: number;
  specialty: string;
}

export interface Student {
  id: number;
  lastname: string;
  name: string;
  course?: number;
  user?: string | null;
  username?: string | null;
  year?: number;
  division?: number;
  specialty?: string;
}

/** Fila de asistencia de un curso o materia en una fecha. */
export interface AttendanceRow {
  student: number;
  lastname: string;
  name: string;
  id: number | null;
  presence: Presence | null;
  date: string;
  inherited?: boolean;
  recorded_by: string | null;
}

/** Registro del historial de un alumno. */
export interface AttendanceRecord {
  id: number;
  student: number;
  lastname: string;
  name: string;
  presence: Presence;
  date: string;
  subject: number | null;
  subject_name: string | null;
  recorded_by: string | null;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string | null;
  role: Role;
}
