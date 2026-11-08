import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError('');

    const identificador = cedula.trim();

    if (!identificador) {
      setError('Ingrese su cédula de identidad o correo institucional.');
      return;
    }

    const esEmail = identificador.includes('@');
    if (!esEmail && !/^\d{5,9}$/.test(identificador.replace(/\D/g, ''))) {
      setError('Ingrese una cédula válida (entre 5 y 9 dígitos) o un correo electrónico.');
      return;
    }

    if (!password) {
      setError('Ingrese su contraseña.');
      return;
    }

    setEnviando(true);

    try {
      await iniciarSesion(identificador, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No fue posible iniciar sesión. Intente nuevamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-5" noValidate>
      <div>
        <label htmlFor="usuario" className="label">
          Cédula o correo institucional
        </label>
        <input
          id="usuario"
          name="usuario"
          type="text"
          inputMode="text"
          autoComplete="username"
          autoFocus
          value={cedula}
          onChange={(evento) => setCedula(evento.target.value)}
          placeholder="Ej. 12345678 o dticucfaces@gmail.com"
          className="input"
          disabled={enviando}
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={mostrarPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            placeholder="Ingrese su contraseña"
            className="input pr-12"
            disabled={enviando}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((valor) => !valor)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-600"
            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {mostrarPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 3l18 18M10.58 10.58A2 2 0 0 0 13.42 13.42M9.88 5.09A10.94 10.94 0 0 1 12 4.9c5.4 0 9 5.1 9 7.1 0 .7-.4 1.7-1.2 2.7M6.2 6.2C3.9 7.8 2.4 10 2.4 12c0 2 3.6 7.1 9.6 7.1 1.2 0 2.3-.2 3.3-.6"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M2.4 12S6 4.9 12 4.9 21.6 12 21.6 12 18 19.1 12 19.1 2.4 12 2.4 12Z"
                />
                <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          {error}
        </div>
      ) : null}

      <button type="submit" className={`btn-primary w-full py-3.5 animate-pulse ${enviando ? 'opacity-90' : ''}`} disabled={enviando}>
        {enviando ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
            </svg>
            Verificando...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </button>
    </form>
  );
}
