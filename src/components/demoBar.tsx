import { useState } from 'react';
import { DEMO_TIPS, DemoUser, demoLogin, demoReset } from '../demo';
import { errorMessage } from '../api';
import { Role, ROLE_LABELS } from '../types';

function label(u: DemoUser, all: DemoUser[]) {
  const sameRole = all.filter((x) => x.role === u.role).length > 1;
  return sameRole ? `${ROLE_LABELS[u.role]} (${u.username})` : ROLE_LABELS[u.role];
}

// Barra del modo demo: cambiar de rol con un clic y ver qué puede hacer cada uno.
function DemoBar({ users, username, role, onSwitched }: {
  users: DemoUser[];
  username?: string;
  role?: Role;
  onSwitched: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = users.find((u) => u.username === username);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      await onSwitched();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm('¿Restablecer los datos de la demo? Se pierden los cambios hechos.')) return;
    await run(async () => {
      await demoReset();
      await demoLogin(username ?? users[0].username);
    });
  }

  return (
    <div className="demo-bar">
      <div className="demo-row">
        <strong>Modo demo · Ver como:</strong>
        {users.map((u) => (
          <button
            key={u.username}
            type="button"
            className={u.username === username ? 'primary' : ''}
            disabled={busy}
            onClick={() => u.username !== username && run(() => demoLogin(u.username))}
          >
            {label(u, users)}
          </button>
        ))}
        <button type="button" className="danger" disabled={busy} onClick={reset}>Restablecer datos</button>
      </div>
      {current && role && (
        <p className="demo-help">
          <b>{current.name} ({ROLE_LABELS[role]}):</b> {current.description} <em>Probá: {DEMO_TIPS[role]}</em>
        </p>
      )}
      {!current && role && <p className="demo-help">Estás con una cuenta que no es de la demo.</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default DemoBar;
