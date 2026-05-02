import React, { useState, useEffect } from 'react';
import { httpRequest, buildFormBody } from '../api';
import { AttendanceRecord, Course, Student } from '../types';
import { getLatestRecords, fetchCourses } from '../utils';
function Attendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchCourses( setCourses, setSelectedCourse);
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse);
    }
  }, [selectedCourse]);



  async function loadStudents(courseId: string) {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {

      const [studentsResult, attendanceResult] = await Promise.all([
        httpRequest<Student[]>(`students/${courseId}`),
        httpRequest<AttendanceRecord[]>('asistances/get', 'POST', { course: courseId, date: today })
      ]);
      setStudents(Array.isArray(studentsResult) ? studentsResult : []);
      setPresenceMap(getLatestRecords(attendanceResult));
    } catch (error) {
      console.error(error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePresence(studentId: string, presence: string) {
    await httpRequest('asistances', 'POST', { studentId, presence });
    setPresenceMap((prev) => ({ ...prev, [studentId]: presence }));
  }

  async function handleNewStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = buildFormBody(form);
    if (!body || !selectedCourse) {
      setFormMessage('Complete todos los campos antes de enviar.');
      return;
    }
    body.course = selectedCourse;

    await httpRequest('student', 'POST', body);
    setEditing(false);
    setFormMessage('Alumno creado correctamente.');
    setTimeout(() => setFormMessage(''), 3000);
    loadStudents(selectedCourse);
  }

  return (
    <div className="container">
      <h2>Registro de asistencias</h2>
      <div>
        <select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
          {courses.map((course) => (
            <option key={course.id} value={String(course.id)}>
              {course.year} {course.division} {course.specialty}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando alumnos...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>Presencia</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.lastname}</td>
                <td>{student.name}</td>
                <td>
                  {['P', 'T', 'A', 'RA'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={presenceMap[student.id] === option ? option : ''}
                      onClick={() => handlePresence(student.id, option)}
                    >
                      {option}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div>
        <button onClick={() => setEditing((current) => !current)} type="button">
          {editing ? 'Cancelar alumno' : 'Añadir alumno'}
        </button>
      </div>

      {editing && (
        <form onSubmit={handleNewStudent} className="form-row">
          <input name="lastname" placeholder="Apellido" />
          <input name="name" placeholder="Nombre" />
          <button type="submit">Confirmar</button>
        </form>
      )}

      {formMessage && <p>{formMessage}</p>}
    </div>
  );
}

export default Attendance;