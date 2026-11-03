import { useState, useEffect } from 'react';
import { httpRequest, buildFormBody, errorMessage } from '../api';
import { Course, Role, StaffUser, Student, Subject } from '../types';
import { courseLabel, fetchCourses, fullName } from '../utils';

type LoadMode = 'Curso' | 'Materia' | 'Estudiantes';

const MODES_BY_ROLE: Record<string, LoadMode[]> = {
  admin: ['Curso', 'Estudiantes', 'Materia'],
  preceptor: ['Curso', 'Estudiantes'],
  profesor: ['Materia'],
};

function Load({ role }: { role: Role }) {
  const modes = MODES_BY_ROLE[role] ?? [];
  const [mode, setMode] = useState<LoadMode>(modes[0]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<StaffUser[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refreshCourses();
    if (role === 'admin') httpRequest<StaffUser[]>('staff?role=profesor').then(setTeachers).catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    if (mode === 'Estudiantes') httpRequest<Student[]>(`students/${selectedCourse}`).then(setStudents).catch(fail);
    if (mode === 'Materia') httpRequest<Subject[]>(`subjects/${selectedCourse}`).then(setSubjects).catch(fail);
  }, [mode, selectedCourse]);

  function refreshCourses() {
    fetchCourses(setCourses, (id) => setSelectedCourse((current) => current || id)).catch(fail);
  }

  function fail(e: unknown) {
    setError(errorMessage(e));
  }

  function flash(text: string) {
    setError('');
    setMessage(text);
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = buildFormBody(form, ['hours']);
    if (!body) {
      setError('Complete todos los campos antes de enviar.');
      return;
    }
    try {
      if (mode === 'Curso') {
        await httpRequest('courses', 'POST', body);
        flash('Curso creado correctamente.');
        refreshCourses();
      }
      if (mode === 'Materia') {
        await httpRequest('subjects', 'POST', { ...body, course: selectedCourse });
        flash('Materia creada correctamente.');
        setSubjects(await httpRequest<Subject[]>(`subjects/${selectedCourse}`));
      }
      if (mode === 'Estudiantes') {
        await httpRequest('students', 'POST', { ...body, course: selectedCourse });
        flash('Estudiantes cargados correctamente.');
        setStudents(await httpRequest<Student[]>(`students/${selectedCourse}`));
      }
      form.reset();
    } catch (e) {
      fail(e);
    }
  }

  async function remove(path: string, confirmText: string, after: () => void) {
    if (!window.confirm(confirmText)) return;
    try {
      await httpRequest(path, 'DELETE');
      after();
    } catch (e) {
      fail(e);
    }
  }

  const courseSelect = (
    <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} aria-label="Curso">
      {courses.map((course) => (
        <option key={course.id} value={String(course.id)}>{courseLabel(course)}</option>
      ))}
    </select>
  );

  return (
    <div className="container">
      <h2>Carga de datos</h2>
      {modes.length > 1 && (
        <div>
          <select value={mode} onChange={(event) => setMode(event.target.value as LoadMode)}>
            {modes.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      {mode !== 'Curso' && courses.length === 0 && (
        <p className="hint">
          {role === 'profesor'
            ? 'Ningún preceptor te compartió un curso todavía.'
            : 'Primero creá un curso.'}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {mode === 'Curso' && (
          <>
            <input name="year" placeholder="AÑO" inputMode="numeric" />
            <input name="division" placeholder="DIVISIÓN" inputMode="numeric" />
            <input name="specialty" placeholder="ESPECIALIDAD" />
          </>
        )}

        {mode === 'Materia' && (
          <>
            {courseSelect}
            <input name="subject" placeholder="ASIGNATURA" />
            <input name="hours" placeholder="HORAS (opcional)" inputMode="numeric" />
            {role === 'admin' && (
              <select name="teacher" aria-label="Profesor">
                <option value="">Profesor...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </>
        )}

        {mode === 'Estudiantes' && (
          <>
            {courseSelect}
            <textarea name="students" rows={8} placeholder={'APELLIDO NOMBRE\nAPELLIDO, NOMBRE COMPUESTO'} />
          </>
        )}

        <button type="submit" className="primary">Enviar</button>
      </form>

      {mode === 'Curso' && courses.length > 0 && (
        <ListTable
          headers={['Curso']}
          rows={courses.map((c) => ({
            key: c.id,
            cells: [courseLabel(c)],
            onDelete: () => remove(`courses/${c.id}`, `¿Eliminar el curso ${courseLabel(c)} con sus alumnos, materias y asistencias?`, refreshCourses),
          }))}
        />
      )}
      {mode === 'Estudiantes' && students.length > 0 && (
        <ListTable
          headers={['Alumno', 'Cuenta']}
          rows={students.map((s) => ({
            key: s.id,
            cells: [fullName(s), s.username ?? '—'],
            onDelete: () => remove(`students/${s.id}`, `¿Eliminar a ${fullName(s)}?`,
              () => setStudents((prev) => prev.filter((x) => x.id !== s.id))),
          }))}
        />
      )}
      {mode === 'Materia' && subjects.length > 0 && (
        <ListTable
          headers={['Materia', 'Profesor', 'Horas']}
          rows={subjects.map((s) => ({
            key: s.id,
            cells: [s.name, s.teacher_name, s.hours ?? '—'],
            onDelete: () => remove(`subjects/${s.id}`, `¿Eliminar la materia ${s.name}?`,
              () => setSubjects((prev) => prev.filter((x) => x.id !== s.id))),
          }))}
        />
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
}

export function ListTable({ headers, rows }: {
  headers: string[];
  rows: { key: string | number; cells: React.ReactNode[]; onDelete?: () => void }[];
}) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {headers.map((h) => <th key={h}>{h}</th>)}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, i) => <td key={i}>{cell}</td>)}
              <td>{row.onDelete && <button type="button" className="danger" onClick={row.onDelete}>Eliminar</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Load;
