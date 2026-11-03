import { useEffect, useState } from 'react';
import { httpRequest, errorMessage } from '../api';
import { AttendanceRecord, Role, Student } from '../types';
import { courseLabel, fullName } from '../utils';
import AttendanceHistoryTable from './attendanceTable';

// Vista común de alumnos y padres: solo lectura de sus propias asistencias.
function MyAttendance({ role }: { role: Role }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    httpRequest<Student[]>('me/students')
      .then((list) => {
        setStudents(list);
        if (list.length) setSelected(String(list[0].id));
        else setLoading(false);
      })
      .catch((e) => { setError(errorMessage(e)); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    httpRequest<AttendanceRecord[]>(`asistances/student/${selected}`)
      .then(setRecords)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [selected]);

  const student = students.find((s) => String(s.id) === selected);

  return (
    <div className="container">
      <h2>{role === 'padre' ? 'Asistencias de mis hijos' : 'Mis asistencias'}</h2>
      {students.length > 1 && (
        <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Alumno">
          {students.map((s) => <option key={s.id} value={String(s.id)}>{fullName(s)}</option>)}
        </select>
      )}
      {student && student.year !== undefined && (
        <p className="muted">{fullName(student)} — {courseLabel(student as Required<Student>)}</p>
      )}
      {!loading && students.length === 0 && !error && (
        <p className="hint">Tu cuenta todavía no está vinculada a ningún alumno. Consultá con la administración.</p>
      )}
      {loading ? <p className="loading">Cargando...</p> : student && <AttendanceHistoryTable records={records} />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default MyAttendance;
