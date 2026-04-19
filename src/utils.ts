import { AttendanceRecord, Course } from './types';
import { httpRequest } from './api';
function getLatestRecords(records: AttendanceRecord[] | null | undefined) {
  if (!Array.isArray(records)) return {};
  const latestByStudent = new Map<string, AttendanceRecord>();

  for (const record of records) {
    const previous = latestByStudent.get(record.student);
    if (!previous || new Date(record.date) > new Date(previous.date)) {
      latestByStudent.set(record.student, record);
    }
  }

  return Object.fromEntries(
    Array.from(latestByStudent.entries()).map(([student, record]) => [student, record.presence])
  );
}
async function fetchCourses(setCourses: (courses: Course[]) => void,setSelectedCourse: (selectedCourse: string) => void) {
    const response = await httpRequest<{courses: Course[]}>('courses');
    const courses = response.courses;
    if (Array.isArray(courses)) {
      setCourses(courses);
      if (courses.length > 0) {
        setSelectedCourse(String(courses[0].id));
      }
    }
}

export { getLatestRecords, fetchCourses };
