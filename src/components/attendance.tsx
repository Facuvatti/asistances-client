import React, { useState, useEffect } from 'react';
import { httpRequest, buildFormBody, errorMessage } from '../api';
import { AttendanceRow, Course, Presence, PRESENCES, PRESENCE_LABELS, Role, Subject } from '../types';
import { courseLabel, fetchCourses, subjectLabel, today } from '../utils';

// Preceptor: asistencia del curso. Profesor: asistencia de sus materias, heredando lo que cargó
// el preceptor para los alumnos que todavía no marcó.
function Attendance({ role }: { role: Role }) {
  const bySubject = role === 'profesor';
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = bySubject
      ? httpRequest<Subject[]>('subjects').then((list) => {
          setSubjects(list);
          if (list.length) setSelected(String(list[0].id));
        })
      : fetchCourses(setCourses, setSelected);
    load.catch((e) => setError(errorMessage(e)));
  }, [bySubject]);

  useEffect(() => {
    if (selected) loadRows();
  }, [selected, date]);

  async function loadRows() {
    setLoading(true);
    setError('');
    try {
      const path = bySubject ? `asistances/subject/${selected}` : `asistances/course/${selected}`;
      setRows(await httpRequest<AttendanceRow[]>(`${path}?date=${date}`));
    } catch (e) {
      setError(errorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePresence(student: number, presence: Presence) {
    setError('');
    try {
      await httpRequest('asistances', 'POST', {
        studentId: student,
        presence,
        date,
        ...(bySubject ? { subjectId: Number(selected) } : {}),
      });
      setRows((prev) => prev.map((r) => (r.student === student ? { ...r, presence, inherited: false } : r)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function confirmInherited() {
    try {
      const result = await httpRequest<{ confirmed: number }>(`asistances/subject/${selected}/confirm`, 'POST', { date });
      flash(`Se confirmaron ${result.confirmed} asistencias heredadas.`);
      loadRows();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function handleNewStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = buildFormBody(event.currentTarget);
    if (!body || !selected) {
      setError('Complete todos los campos antes de enviar.');
      return;
    }
    try {
      await httpRequest('student', 'POST', { ...body, course: selected });
      setEditing(false);
      flash('Alumno creado correctamente.');
      loadRows();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  }

  const inheritedCount = rows.filter((r) => r.inherited).length;
  const options = bySubject
    ? subjects.map((s) => ({ id: s.id, label: subjectLabel(s) }))
    : courses.map((c) => ({ id: c.id, label: courseLabel(c) }));

  return (
    <div className="container">
      <h2>{bySubject ? 'Asistencia por materia' : 'Asistencia del curso'}</h2>
      <div className="filters">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label={bySubject ? 'Materia' : 'Curso'}>
          {options.map((o) => <option key={o.id} value={String(o.id)}>{o.label}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} aria-label="Fecha" />
      </div>

      {options.length === 0 && !loading && (
        <p className="hint">
          {bySubject
            ? 'Todavía no tenés materias. Creálas en "Cargas", en los cursos que te compartió el preceptor.'
            : 'No tenés cursos. Creá uno en "Cargas".'}
        </p>
      )}

      {bySubject && inheritedCount > 0 && (
        <div className="notice">
          <span>{inheritedCount} alumno(s) muestran la asistencia que tomó el preceptor (<em>heredada</em>).</span>
          <button type="button" onClick={confirmInherited}>Confirmar heredadas</button>
        </div>
      )}

      {loading ? (
        <p className="loading">Cargando alumnos...</p>
      ) : options.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Presencia</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student} className={row.inherited ? 'inherited' : ''}>
                  <td>{row.lastname}</td>
                  <td>
                    {row.name}
                    {row.inherited && <span className="tag" title={`Cargado por ${row.recorded_by ?? 'el preceptor'}`}>heredado</span>}
                  </td>
                  <td>
                    {PRESENCES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        title={PRESENCE_LABELS[option]}
                        className={row.presence === option ? option : ''}
                        onClick={() => handlePresence(row.student, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!bySubject && selected && (
        <>
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
        </>
      )}

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
}

export default Attendance;
