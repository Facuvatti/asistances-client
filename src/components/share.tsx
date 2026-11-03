import { useEffect, useState } from 'react';
import { httpRequest, errorMessage } from '../api';
import { Course, Role, ROLE_LABELS, StaffUser } from '../types';
import { courseLabel, fetchCourses } from '../utils';

// El preceptor comparte sus cursos con los profesores que corresponda (el admin, además, asigna preceptores).
function Share({ role }: { role: Role }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [access, setAccess] = useState<(StaffUser & { granted_by: string | null })[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCourses(setCourses, setSelectedCourse).catch((e) => setError(errorMessage(e)));
    const roles = role === 'admin' ? ['profesor', 'preceptor'] : ['profesor'];
    Promise.all(roles.map((r) => httpRequest<StaffUser[]>(`staff?role=${r}`)))
      .then((lists) => setStaff(lists.flat()))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => {
    if (selectedCourse) loadAccess();
  }, [selectedCourse]);

  async function loadAccess() {
    try {
      setAccess(await httpRequest(`courses/${selectedCourse}/access`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function share() {
    if (!selectedUser) return;
    setError('');
    try {
      await httpRequest(`courses/${selectedCourse}/access`, 'POST', { userId: selectedUser });
      setMessage('Curso compartido.');
      setTimeout(() => setMessage(''), 3000);
      setSelectedUser('');
      loadAccess();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function revoke(userId: string) {
    try {
      await httpRequest(`courses/${selectedCourse}/access/${userId}`, 'DELETE');
      loadAccess();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const available = staff.filter((u) => !access.some((a) => a.id === u.id));

  return (
    <div className="container">
      <h2>Compartir cursos</h2>
      <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} aria-label="Curso">
        {courses.map((c) => <option key={c.id} value={String(c.id)}>{courseLabel(c)}</option>)}
      </select>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Con acceso</th><th>Rol</th><th></th></tr>
          </thead>
          <tbody>
            {access.map((u) => (
              <tr key={u.id}>
                <td>{u.name} <span className="muted">@{u.username}</span></td>
                <td>{ROLE_LABELS[u.role]}</td>
                <td>
                  {(role === 'admin' || u.role === 'profesor') && (
                    <button type="button" className="danger" onClick={() => revoke(u.id)}>Quitar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-row">
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} aria-label="Usuario">
          <option value="">{role === 'admin' ? 'Profesor o preceptor...' : 'Profesor...'}</option>
          {available.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>
          ))}
        </select>
        <button type="button" className="primary" onClick={share} disabled={!selectedUser}>Compartir</button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
}

export default Share;
