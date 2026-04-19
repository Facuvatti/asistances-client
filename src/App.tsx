import { useEffect, useMemo, useState } from 'react';
import { httpRequest, buildFormBody } from './api';
import { AccountResponse, AttendanceRecord, Course, Student } from './types';

type Page = 'attendance' | 'load' | 'account' | 'history';

type LoadMode = 'Curso' | 'Materia' | 'Estudiantes';

const today = new Date().toISOString().split('T')[0];

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

function Header({ user, onNavigate, onLogout }: { user?: string; onNavigate: (page: Page) => void; onLogout: () => void }) {
  return (
    <header>
      <h1>Asistencias</h1>
      <button onClick={() => onNavigate('attendance')} className="menu">
        Asistencias
      </button>
      <button onClick={() => onNavigate('load')} className="menu">
        Cargas
      </button>
      <button onClick={() => onNavigate('history')} className="menu">
        Historial
      </button>
      {user ? (
        <button onClick={onLogout} className="menu">
          Cerrar sesión
        </button>
      ) : (
        <button onClick={() => onNavigate('account')} className="menu">
          Cuenta
        </button>
      )}
    </header>
  );
}

function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse);
    }
  }, [selectedCourse]);

  async function fetchCourses() {
    const response = await httpRequest<Course[]>('courses');
    if (Array.isArray(response)) {
      setCourses(response);
      if (response.length > 0) {
        setSelectedCourse(String(response[0].id));
      }
    }
  }

  async function loadStudents(courseId: string) {
    setLoading(true);
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
          <option value="">Seleccione un curso</option>
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

function LoadPage() {
  const [mode, setMode] = useState<LoadMode>('Curso');
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const result = await httpRequest<Course[]>('courses');
    if (Array.isArray(result)) setCourses(result);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = buildFormBody(form);
    if (!body) {
      setMessage('Complete todos los campos antes de enviar.');
      return;
    }

    if (mode === 'Curso') {
      await httpRequest('courses', 'POST', body);
      setMessage('Curso creado correctamente.');
    }

    if (mode === 'Materia') {
      await httpRequest('subjects', 'POST', body);
      setMessage('Materia creada correctamente.');
    }

    if (mode === 'Estudiantes') {
      await httpRequest('students', 'POST', body);
      setMessage('Estudiantes cargados correctamente.');
    }

    form.reset();
    setTimeout(() => setMessage(''), 4000);
  }

  const studentsMode = mode === 'Estudiantes';

  return (
    <div className="container">
      <h2>Carga de datos</h2>
      <div>
        <select value={mode} onChange={(event) => setMode(event.target.value as LoadMode)}>
          <option>Curso</option>
          <option>Materia</option>
          <option>Estudiantes</option>
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'Curso' && (
          <>
            <input name="year" placeholder="AÑO" />
            <input name="division" placeholder="DIVISIÓN" />
            <input name="specialty" placeholder="ESPECIALIDAD" />
          </>
        )}

        {mode === 'Materia' && (
          <>
            <select name="course">
              <option value="">Seleccione un curso</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.year} {course.division} {course.specialty}
                </option>
              ))}
            </select>
            <input name="subject" placeholder="ASIGNATURA" />
            <input name="teacher" placeholder="PROFESOR" />
            <input name="hours" placeholder="HORAS" />
          </>
        )}

        {studentsMode && (
          <>
            <select name="course">
              <option value="">Seleccione un curso</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.year} {course.division} {course.specialty}
                </option>
              ))}
            </select>
            <textarea name="students" rows={8} placeholder="APELLIDO NOMBRE\nAPELLIDO NOMBRE" />
          </>
        )}

        <button type="submit">Enviar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

function AccountPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [message, setMessage] = useState<string>('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = buildFormBody(event.currentTarget);
    if (!body) {
      setMessage('Complete todos los campos antes de enviar.');
      return;
    }

    const response = (await httpRequest<AccountResponse>(`account/${mode}`, 'POST', body)) || {};
    if (!response.ok) {
      setMessage(response.error || 'Error al procesar la cuenta');
      return;
    }

    setMessage(response.message || 'Operación correcta.');
    setTimeout(() => onLogin(), 500);
  }

  return (
    <div className="container">
      <h2>{mode === 'register' ? 'Registrarse' : 'Iniciar sesión'}</h2>
      <div>
        <button onClick={() => setMode('register')} type="button">
          Registrarse
        </button>
        <button onClick={() => setMode('login')} type="button">
          Iniciar sesión
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Nombre" />
        <input name="password" type="password" placeholder="Contraseña" />
        <button type="submit">Enviar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

function HistoryPage() {
  return (
    <div className="container">
      <h2>Historial</h2>
      <p>El historial se rehará manualmente en una próxima etapa.</p>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>('attendance');
  const [user, setUser] = useState<string | undefined>();
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const session = await httpRequest<AccountResponse>('account');
    setUser(session.user);
  }

  async function handleLogout() {
    await httpRequest('account/logout', 'POST');
    setUser(undefined);
    setPage('account');
    setStatusMessage('Sesión cerrada.');
    setTimeout(() => setStatusMessage(''), 3000);
  }

  function handleLogin() {
    setPage('attendance');
    setUser('');
    setStatusMessage('Sesión iniciada.');
    setTimeout(() => setStatusMessage(''), 3000);
  }

  return (
    <>
      <Header user={user} onNavigate={setPage} onLogout={handleLogout} />
      {statusMessage && <p>{statusMessage}</p>}
      {page === 'attendance' && <AttendancePage />}
      {page === 'load' && <LoadPage />}
      {page === 'account' && <AccountPage onLogin={handleLogin} />}
      {page === 'history' && <HistoryPage />}
    </>
  );
}

export default App;
