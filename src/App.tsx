import { useEffect, useState } from 'react';
import { httpRequest } from './api';
import { AccountResponse } from './types';
import { Attendance, History, Load, Account } from './components';
type Page = 'attendance' | 'load' | 'account' | 'history';

function Header({ user, onNavigate, onLogout }: { user?: string; onNavigate: (page: Page) => void; onLogout: () => void }) {
    useEffect(() => user = undefined, [onLogout]);
    return (
    <header>
        <h1>Asistencias</h1>
        <ul>
            <li><a onClick={() => onNavigate('attendance')} className="menu">Asistencias</a></li>
            <li><a onClick={() => onNavigate('load')} className="menu">Cargas</a></li>
            <li><a onClick={() => onNavigate('history')} className="menu">Historial</a></li>
            <li>{user ? (<a onClick={onLogout} className="menu">Cerrar sesión</a>) : 
                (<a onClick={() => onNavigate('account')} className="menu">Cuenta</a>)
            }</li>
        </ul>
    </header>
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
    setStatusMessage('Sesión cerrada.');
  }

  function handleLogin() {
    setPage('attendance');
    checkSession();
    setStatusMessage('Sesión iniciada.');
    setTimeout(() => setStatusMessage(''), 3000);
  }

  return (
    <>
      <Header user={user} onNavigate={setPage} onLogout={handleLogout} />

      {!user ? (<Account onLogin={handleLogin} />) : (<>
      {page === 'attendance' && <Attendance user={user} />}
      {page === 'load' && <Load  user={user} />}
      {page === 'account' && <Account onLogin={handleLogin} />}
      {page === 'history' && <History user={user} />}
      {statusMessage && <p>{statusMessage}</p>}
      </>)}
    </>
  );
}

export default App;
