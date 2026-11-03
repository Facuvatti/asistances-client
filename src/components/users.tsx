import { useEffect, useState } from 'react';
import { API_URL, httpRequest, errorMessage, ApiError } from '../api';
import { authClient } from '../auth';
import { Course, Role, ROLE_LABELS, Student } from '../types';
import { courseLabel, fetchCourses, fullName } from '../utils';

interface UserRow {
  id: string;
  name: string;
  username?: string | null;
  role?: string | null;
}

interface ImportRow {
  row: number;
  username: string;
  role?: string;
  status: 'valid' | 'created' | 'error';
  error?: string;
  password?: string;
}

interface ImportResponse {
  ok: boolean;
  dryRun: boolean;
  created: number;
  errors: number;
  results: ImportRow[];
  error?: string;
}

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const STATUS_LABELS = { valid: 'Válida', created: 'Creada', error: 'Error' };

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Administración de cuentas: alta individual, importación CSV, roles, contraseñas y vínculos.
function Users({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
    fetchCourses(setCourses).catch(fail);
  }, []);

  function fail(e: unknown) {
    setMessage('');
    setError(errorMessage(e));
  }

  function flash(text: string) {
    setError('');
    setMessage(text);
    setTimeout(() => setMessage(''), 5000);
  }

  async function loadUsers() {
    const { data, error } = await authClient.admin.listUsers({ query: { limit: 500, sortBy: 'name' } });
    if (error) return fail(new Error(error.message));
    setUsers((data?.users ?? []) as UserRow[]);
  }

  async function changeRole(user: UserRow, role: Role) {
    const { error } = await authClient.admin.setRole({ userId: user.id, role: role as any });
    if (error) return fail(new Error(error.message));
    flash(`Rol de ${user.name} cambiado a ${ROLE_LABELS[role]}.`);
    loadUsers();
  }

  async function resetPassword(user: UserRow) {
    const newPassword = window.prompt(`Nueva contraseña para ${user.name} (mínimo 6 caracteres):`);
    if (!newPassword) return;
    const { error } = await authClient.admin.setUserPassword({ userId: user.id, newPassword });
    if (error) return fail(new Error(error.message));
    flash('Contraseña actualizada.');
  }

  async function removeUser(user: UserRow) {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.name}?`)) return;
    const { error } = await authClient.admin.removeUser({ userId: user.id });
    if (error) return fail(new Error(error.message));
    flash('Cuenta eliminada.');
    loadUsers();
  }

  return (
    <>
      <div className="container">
        <h2>Usuarios</h2>
        <CreateUser courses={courses} onCreated={(text) => { flash(text); loadUsers(); }} onError={fail} />
        <ImportCsv onDone={loadUsers} />
      </div>

      <div className="container">
        <h2>Cuentas ({users.length})</h2>
        <div className="table-wrapper">
          <table className="readonly">
            <thead>
              <tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="muted">{u.username}</td>
                  <td>
                    <select
                      value={u.role ?? ''}
                      disabled={u.id === currentUserId}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      aria-label={`Rol de ${u.name}`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td className="actions">
                    <button type="button" onClick={() => resetPassword(u)}>Contraseña</button>
                    {u.id !== currentUserId && <button type="button" className="danger" onClick={() => removeUser(u)}>Eliminar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
      </div>

      <LinkStudent courses={courses} users={users} onError={fail} onDone={flash} />
    </>
  );
}

function CreateUser({ courses, onCreated, onError }: {
  courses: Course[];
  onCreated: (text: string) => void;
  onError: (e: unknown) => void;
}) {
  const [role, setRole] = useState<Role>('estudiante');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const course = courses.find((c) => String(c.id) === data.course);
    try {
      const result = await httpRequest<ImportRow>('users', 'POST', {
        username: data.username,
        name: data.name,
        lastname: data.lastname,
        password: data.password,
        role,
        children: data.children,
        ...(course ? { year: course.year, division: course.division, specialty: course.specialty } : {}),
      });
      form.reset();
      onCreated(result.password
        ? `Usuario ${result.username} creado. Contraseña generada: ${result.password}`
        : `Usuario ${result.username} creado.`);
    } catch (e) {
      onError(e);
    }
  }

  const withCourse = role === 'estudiante' || role === 'profesor' || role === 'preceptor';
  return (
    <details>
      <summary>Crear un usuario</summary>
      <form onSubmit={handleSubmit}>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Rol">
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <input name="username" placeholder="Usuario (para iniciar sesión)" autoCapitalize="none" required />
        <input name="name" placeholder={role === 'estudiante' ? 'Nombre' : 'Nombre y apellido'} required />
        {role === 'estudiante' && <input name="lastname" placeholder="Apellido" />}
        <input name="password" type="text" placeholder="Contraseña (vacío = generar)" autoComplete="new-password" />
        {withCourse && (
          <select name="course" aria-label="Curso">
            <option value="">{role === 'estudiante' ? 'Curso (opcional)' : 'Dar acceso a un curso (opcional)'}</option>
            {courses.map((c) => <option key={c.id} value={String(c.id)}>{courseLabel(c)}</option>)}
          </select>
        )}
        {role === 'padre' && <input name="children" placeholder="Usuarios de sus hijos, separados por ;" />}
        <button type="submit" className="primary">Crear</button>
      </form>
    </details>
  );
}

function ImportCsv({ onDone }: { onDone: () => void }) {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    setResult(null);
    setError('');
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function send(dryRun: boolean) {
    setBusy(true);
    setError('');
    try {
      const response = await httpRequest<ImportResponse>('users/import', 'POST', { csv, dryRun });
      setResult(response);
      if (!dryRun) onDone();
    } catch (e) {
      // Con errores de validación la API responde 400 con el detalle por fila.
      if (e instanceof ApiError && e.body?.results) setResult(e.body);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    try {
      const response = await fetch(`${API_URL}/users/import/template`, { credentials: 'include' });
      downloadText('usuarios.csv', await response.text());
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function downloadResult() {
    if (!result) return;
    const lines = [['fila', 'usuario', 'rol', 'estado', 'contraseña', 'error'].join(',')];
    for (const r of result.results) {
      lines.push([r.row, r.username, r.role, STATUS_LABELS[r.status], r.password, r.error].map(csvCell).join(','));
    }
    downloadText('resultado-usuarios.csv', lines.join('\n'));
  }

  return (
    <details>
      <summary>Importar usuarios desde CSV</summary>
      <p className="hint">
        Columnas: <code>username, name, lastname, password, role, year, division, specialty, children</code>{' '}
        (también en español). Si alguna fila tiene errores no se crea ningún usuario. Si la contraseña
        está vacía se genera una: descargá el resultado para repartirlas.
      </p>
      <div className="form-row">
        <input type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0])} aria-label="Archivo CSV" />
        <button type="button" onClick={downloadTemplate}>Descargar plantilla</button>
      </div>
      {csv && (
        <div className="form-row">
          <span className="muted">{fileName}</span>
          <button type="button" onClick={() => send(true)} disabled={busy}>Validar</button>
          <button type="button" className="primary" onClick={() => send(false)} disabled={busy}>Importar</button>
        </div>
      )}
      {result && (
        <>
          <p className={result.ok ? 'success' : 'error'}>
            {result.dryRun && result.ok
              ? `Archivo válido: ${result.results.length} usuarios listos para importar.`
              : result.ok
                ? `Se crearon ${result.created} usuarios.`
                : result.error ?? `${result.errors} fila(s) con errores.`}
          </p>
          <div className="table-wrapper">
            <table className="readonly">
              <thead>
                <tr><th>Fila</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Detalle</th></tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.row} className={r.status === 'error' ? 'row-error' : ''}>
                    <td>{r.row}</td>
                    <td>{r.username}</td>
                    <td>{r.role && ROLE_LABELS[r.role as Role] || r.role}</td>
                    <td>{STATUS_LABELS[r.status]}</td>
                    <td>{r.error ?? (r.password ? `Contraseña: ${r.password}` : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.dryRun && result.created > 0 && (
            <button type="button" onClick={downloadResult}>Descargar resultado (con contraseñas)</button>
          )}
        </>
      )}
      {error && !result && <p className="error">{error}</p>}
    </details>
  );
}

// Vincula cuentas existentes con un alumno: la del propio alumno y las de sus padres.
function LinkStudent({ courses, users, onError, onDone }: {
  courses: Course[];
  users: UserRow[];
  onError: (e: unknown) => void;
  onDone: (text: string) => void;
}) {
  const [course, setCourse] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState('');
  const [guardians, setGuardians] = useState<UserRow[]>([]);
  const [account, setAccount] = useState('');
  const [parent, setParent] = useState('');

  useEffect(() => {
    if (!course && courses.length) setCourse(String(courses[0].id));
  }, [courses]);

  useEffect(() => {
    if (!course) return;
    httpRequest<Student[]>(`students/${course}`).then((list) => {
      setStudents(list);
      setStudent(list.length ? String(list[0].id) : '');
    }).catch(onError);
  }, [course]);

  const current = students.find((s) => String(s.id) === student);

  useEffect(() => {
    if (!student) return setGuardians([]);
    setAccount(current?.user ?? '');
    httpRequest<UserRow[]>(`students/${student}/guardians`).then(setGuardians).catch(onError);
  }, [student, students]);

  async function reloadStudents() {
    setStudents(await httpRequest<Student[]>(`students/${course}`));
  }

  async function saveAccount() {
    try {
      await httpRequest(`students/${student}/user`, 'PUT', { userId: account || null });
      onDone(account ? 'Cuenta del alumno vinculada.' : 'Cuenta del alumno desvinculada.');
      reloadStudents();
    } catch (e) {
      onError(e);
    }
  }

  async function addParent() {
    if (!parent) return;
    try {
      await httpRequest(`students/${student}/guardians`, 'POST', { userId: parent });
      setParent('');
      setGuardians(await httpRequest<UserRow[]>(`students/${student}/guardians`));
    } catch (e) {
      onError(e);
    }
  }

  async function removeParent(id: string) {
    try {
      await httpRequest(`students/${student}/guardians/${id}`, 'DELETE');
      setGuardians((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      onError(e);
    }
  }

  const studentAccounts = users.filter((u) => u.role === 'estudiante');
  const parents = users.filter((u) => u.role === 'padre' && !guardians.some((g) => g.id === u.id));

  return (
    <div className="container">
      <h2>Vincular alumnos con cuentas</h2>
      <div className="filters">
        <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Curso">
          {courses.map((c) => <option key={c.id} value={String(c.id)}>{courseLabel(c)}</option>)}
        </select>
        <select value={student} onChange={(e) => setStudent(e.target.value)} aria-label="Alumno">
          {students.map((s) => <option key={s.id} value={String(s.id)}>{fullName(s)}</option>)}
        </select>
      </div>
      {current && (
        <>
          <div className="form-row">
            <label>Cuenta del alumno</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)} aria-label="Cuenta del alumno">
              <option value="">Sin cuenta</option>
              {studentAccounts.map((u) => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
            </select>
            <button type="button" onClick={saveAccount}>Guardar</button>
          </div>
          <div className="form-row">
            <label>Padres / tutores</label>
            {guardians.map((g) => (
              <span key={g.id} className="tag">
                {g.name} <a className="remove" onClick={() => removeParent(g.id)} title="Quitar">×</a>
              </span>
            ))}
            <select value={parent} onChange={(e) => setParent(e.target.value)} aria-label="Padre">
              <option value="">Agregar padre...</option>
              {parents.map((u) => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
            </select>
            <button type="button" onClick={addParent} disabled={!parent}>Agregar</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Users;
