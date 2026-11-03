import { AttendanceRecord, PRESENCE_LABELS, PRESENCES } from '../types';
import { formatDate } from '../utils';

// Tabla de solo lectura con el historial de un alumno (curso + materias) y un resumen.
function AttendanceHistoryTable({ records }: { records: AttendanceRecord[] }) {
  if (records.length === 0) return <p className="hint">No hay asistencias registradas.</p>;
  const courseRecords = records.filter((r) => r.subject === null);
  return (
    <>
      <div className="summary">
        {PRESENCES.map((p) => (
          <span key={p} className={`badge ${p}`}>
            {PRESENCE_LABELS[p]}: {courseRecords.filter((r) => r.presence === p).length}
          </span>
        ))}
        <span className="muted">(asistencia del curso)</span>
      </div>
      <div className="table-wrapper">
        <table className="readonly">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Curso / Materia</th>
              <th>Presencia</th>
              <th>Cargó</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>{r.subject_name ?? 'Curso (preceptor)'}</td>
                <td><span className={`badge ${r.presence}`}>{PRESENCE_LABELS[r.presence]}</span></td>
                <td className="muted">{r.recorded_by ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AttendanceHistoryTable;
