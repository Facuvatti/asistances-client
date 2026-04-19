import { useState } from 'react';
import { buildFormBody, httpRequest } from '../api';
import { AccountResponse } from '../types'; 
function Account({ onLogin,user }: { onLogin: () => void, user: string | undefined }) {
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
    if (response.error) {
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

export default Account;