import { useEffect, useState } from 'react';
import { httpRequest, errorMessage } from '../api';
import { AttendanceRecord, AttendanceRow, Course, PRESENCE_LABELS, Role, Student, Subject } from '../types';
import { courseLabel, fetchCourses, fullName, today } from '../utils';
import AttendanceHistoryTable from './attendanceTable';

type Mode = 'fecha' | 'alumno';

// Historial de solo lectura para admin, preceptor y profesor.
function History({ role }: { role: Role }) {
  const [mode, setMode] = useState<Mode>('fecha');
  const [courses, setCourses] = useState<Course[]>([]);
  const [course, setCourse] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // '' = asistencia del curso (preceptor); si no, id de materia.
  const [subject, setSubject] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState('');
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses(setCourses, setCourse).catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    if (!course) return;
    setError('');
    httpRequest<Subject[]>(`subjects/${course}`).then((list) => {
      setSubjects(list);
      // El profesor ve por defecto su primera materia.
      setSubject(role === 'profesor' && list.length ? String(list[0].id) : '');
    }).catch((e) => setError(errorMessage(e)));
    httpRequest<Student[]>(`students/${course}`).then((list) => {
      setStudents(list);
      setStudent(list.length ? String(list[0].id) : '');
    }).catch((e) => setError(errorMessage(e)));
  }, [course]);

  useEffect(() => {
    if (mode !== 'fecha' || !course) return;
    const path = subject ? `asistances/subject/${subject}` : `asistances/course/${course}`;
    httpRequest<AttendanceRow[]>(`${path}?date=${date}`).then(setRows).catch((e) => setError(errorMessage(e)));
  }, [mode, course, subject, date]);

  useEffect(() => {
    if (mode !== 'alumno' || !student) return;
    httpRequest<AttendanceRecord[]>(`asistances/student/${student}`).then(setRecords).catch((e) => setError(errorMessage(e)));
  }, [mode, student]);

  return (
    <div className="container">
      <h2>Historial de asistencias</h2>
      <div>
        <button type="button" className={mode === 'fecha' ? 'primary' : ''} onClick={() => setMode('fecha')}>Por fecha</button>
        <button type="button" className={mode === 'alumno' ? 'primary' : ''} onClick={() => setMode('alumno')}>Por alumno</button>
      </div>
      <div className="filters">
        <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Curso">
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{courseLabel(c)}</option>)}
        </select>
        {mode === 'fecha' ? (
          <>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Materia">
              <option value="">Asistencia del curso</option>
              {subjects.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} aria-label="Fecha" />
          </>
        ) : (
          <select value={student} onChange={(e) => setStudent(e.target.value)} aria-label="Alumno">
            {students.map((s) => <option key={s.id} value={String(s.id)}>{fullName(s)}</option>)}
          </select>
        )}
      </div>

      {mode === 'fecha' ? (
        <div className="table-wrapper">
          <table className="readonly">
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Presencia</th>
                <th>Cargó</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student} className={r.inherited ? 'inherited' : ''}>
                  <td>{r.lastname}</td>
                  <td>{r.name}{r.inherited && <span className="tag">heredado</span>}</td>
                  <td>{r.presence ? <span className={`badge ${r.presence}`}>{PRESENCE_LABELS[r.presence]}</span> : <span className="muted">Sin cargar</span>}</td>
                  <td className="muted">{r.recorded_by ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        student && <AttendanceHistoryTable records={records} />
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default History;
