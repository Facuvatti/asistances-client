import { httpRequest } from './api';
import { Course, Subject } from './types';

/** Fecha local AAAA-MM-DD (toISOString usaría UTC y de noche daría el día siguiente). */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function courseLabel(course: Pick<Course, 'year' | 'division' | 'specialty'>): string {
  return `${course.year}° ${course.division}° ${course.specialty}`;
}

export function subjectLabel(subject: Subject): string {
  return `${subject.name} — ${courseLabel(subject)}`;
}

export function fullName(person: { lastname: string; name: string }): string {
  return `${person.lastname}, ${person.name}`;
}

export function formatDate(date: string): string {
  const [y, m, d] = date.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export async function fetchCourses(
  setCourses: (courses: Course[]) => void,
  setSelectedCourse?: (selectedCourse: string) => void
) {
  const courses = await httpRequest<Course[]>('courses');
  if (Array.isArray(courses)) {
    setCourses(courses);
    if (setSelectedCourse && courses.length > 0) setSelectedCourse(String(courses[0].id));
  }
}
