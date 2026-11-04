import { useState } from 'react';
import { authClient } from '../auth';
import { DemoUser } from '../demo';
import { ROLE_LABELS } from '../types';

// Solo inicio de sesión: las cuentas las crea un administrador.
function Account({ onLogin, demoUsers = [], onDemoLogin }: {
  onLogin: () => void;
  demoUsers?: DemoUser[];
  onDemoLogin?: (username: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    if (!username || !password) {
      setMessage('Complete usuario y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await authClient.signIn.username({ username, password });
    setLoading(false);
    if (error) {
      setMessage(error.status === 401 ? 'Usuario o contraseña incorrectos.' : error.message || 'No se pudo iniciar sesión.');
      return;
    }
    onLogin();
  }

  return (
    <div className="container narrow">
      {demoUsers.length > 0 && (
        <>
          <h2>Probá la demo</h2>
          <p className="hint">Entrá con un clic como cualquier rol y mirá qué puede hacer cada uno:</p>
          <div className="demo-roles">
            {demoUsers.map((u) => (
              <button key={u.username} type="button" onClick={() => onDemoLogin?.(u.username)} title={u.description}>
                {ROLE_LABELS[u.role]}{demoUsers.filter((x) => x.role === u.role).length > 1 ? ` (${u.username})` : ''}
              </button>
            ))}
          </div>
        </>
      )}
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Usuario" autoComplete="username" autoCapitalize="none" />
        <input name="password" type="password" placeholder="Contraseña" autoComplete="current-password" />
        <button type="submit" className="primary" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
      <p className="hint">¿No tenés cuenta? Pedísela a la administración de la escuela.</p>
      {message && <p className="error">{message}</p>}
    </div>
  );
}

export default Account;
