import { useEffect, useState } from 'react';
import { authClient } from './auth';
import { Role, ROLE_LABELS } from './types';
import { Attendance, History, Load, Account, Share, Users, MyAttendance, DemoBar } from './components';
import { DemoInfo, demoLogin, fetchDemo } from './demo';

type Page = 'attendance' | 'load' | 'share' | 'history' | 'users' | 'mine';

const PAGES: { page: Page; label: string; roles: Role[] }[] = [
  { page: 'attendance', label: 'Asistencias', roles: ['preceptor', 'profesor'] },
  { page: 'mine', label: 'Mis asistencias', roles: ['estudiante', 'padre'] },
  { page: 'load', label: 'Cargas', roles: ['admin', 'preceptor', 'profesor'] },
  { page: 'share', label: 'Compartir cursos', roles: ['admin', 'preceptor'] },
  { page: 'history', label: 'Historial', roles: ['admin', 'preceptor', 'profesor'] },
  { page: 'users', label: 'Usuarios', roles: ['admin'] },
];

function Header({ name, role, pages, onNavigate, onLogout }: {
  name?: string;
  role?: Role;
  pages: typeof PAGES;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}) {
  return (
    <header>
      <h1>Asistencias</h1>
      <ul>
        {pages.map((p) => (
          <li key={p.page}><a onClick={() => onNavigate(p.page)} className="menu">{p.label}</a></li>
        ))}
        {role && (
          <>
            <li><span className="user-chip">{name} · {ROLE_LABELS[role]}</span></li>
            <li><a onClick={onLogout} className="menu">Cerrar sesión</a></li>
          </>
        )}
      </ul>
    </header>
  );
}

function App() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const pages = PAGES.filter((p) => role && p.roles.includes(role));
  const [page, setPage] = useState<Page | undefined>();
  const [statusMessage, setStatusMessage] = useState('');
  const [demo, setDemo] = useState<DemoInfo>({ enabled: false, users: [] });

  useEffect(() => {
    fetchDemo().then(setDemo);
  }, []);

  // Página inicial (y al cambiar de usuario): la primera disponible para el rol.
  // Al cambiar de usuario (p. ej. en la demo) se vuelve a la pantalla inicial de su rol.
  const userId = session?.user.id;
  useEffect(() => {
    setPage(pages[0]?.page);
  }, [userId, role]);

  async function handleLogout() {
    await authClient.signOut();
    await refetch();
    setStatusMessage('Sesión cerrada.');
    setTimeout(() => setStatusMessage(''), 3000);
  }

  async function handleLogin() {
    await refetch();
    setStatusMessage('');
  }

  return (
    <>
      <Header name={session?.user.name} role={role} pages={pages} onNavigate={setPage} onLogout={handleLogout} />
      {demo.enabled && session && (
        <DemoBar
          users={demo.users}
          username={(session.user as { username?: string }).username}
          role={role}
          onSwitched={async () => { await refetch(); }}
        />
      )}
      <main>
        {isPending ? (
          <p className="loading">Cargando...</p>
        ) : !session || !role ? (
          <Account onLogin={handleLogin} demoUsers={demo.enabled ? demo.users : []} onDemoLogin={async (u) => { await demoLogin(u); await handleLogin(); }} />
        ) : (
          <div key={userId}>
            {page === 'attendance' && <Attendance role={role} />}
            {page === 'mine' && <MyAttendance role={role} />}
            {page === 'load' && <Load role={role} />}
            {page === 'share' && <Share role={role} />}
            {page === 'history' && <History role={role} />}
            {page === 'users' && <Users currentUserId={session.user.id} />}
          </div>
        )}
        {statusMessage && <p className="message">{statusMessage}</p>}
      </main>
    </>
  );
}

export default App;
