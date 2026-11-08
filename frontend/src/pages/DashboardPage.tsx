import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ApiError,
  ConstanciaData,
  descargarConstancia,
  obtenerConstancia,
} from '../api/client';
import InstitutionLogos from '../components/InstitutionLogos';
import NotesTable from '../components/NotesTable';
import SearchBar from '../components/SearchBar';
import StudentSummary from '../components/StudentSummary';
import { useAuth } from '../context/AuthContext';
import { guardarArchivo } from '../utils/download';

type FormatoDescarga = 'docx' | 'pdf';

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export default function DashboardPage() {
  const { usuario, token, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [cedula, setCedula] = useState('');
  const [constancia, setConstancia] = useState<ConstanciaData | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [formatoActivo, setFormatoActivo] = useState<FormatoDescarga | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError('');
    setMensaje('');

    const digitos = cedula.replace(/\D/g, '');

    if (!/^\d{5,9}$/.test(digitos)) {
      setError('Ingrese una cédula válida (entre 5 y 9 dígitos).');
      return;
    }

    if (!token) return;

    setBuscando(true);
    setConstancia(null);

    try {
      const datos = await obtenerConstancia(digitos, token);
      setConstancia(datos);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No fue posible consultar el estudiante. Intente nuevamente.',
      );
    } finally {
      setBuscando(false);
    }
  }

  async function descargar(formato: FormatoDescarga) {
    if (!constancia || !token) return;

    setError('');
    setMensaje('');
    setFormatoActivo(formato);

    try {
      const { blob, filename } = await descargarConstancia(constancia.cedula, token, formato);
      const guardado = await guardarArchivo(blob, filename, formato);

      if (guardado) {
        setMensaje(`Constancia generada correctamente: ${filename}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No fue posible generar la constancia. Intente nuevamente.',
      );
    } finally {
      setFormatoActivo(null);
    }
  }

  function imprimir() {
    if (!constancia) return;

    navigate(`/imprimir/${constancia.cedula}`);
  }

  function salir() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  const esRoot = usuario?.rol === 'ROOT';

  return (
    <div className="min-h-screen bg-[#f7f3f5]">
      <header className="sticky top-0 z-20 border-b border-vinotinto-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <InstitutionLogos compact />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-semibold text-slate-800">{usuario?.nombre}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    esRoot
                      ? 'bg-vinotinto-100 text-vinotinto-800 ring-1 ring-inset ring-vinotinto-200'
                      : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
                  }`}
                >
                  {usuario?.rol}
                </span>
              </div>
              <p className="text-xs text-slate-500">C.I. {usuario?.cedula}</p>
            </div>

            {esRoot ? (
              <Link to="/usuarios" className="btn-secondary px-3 py-2" title="Gestionar usuarios">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                  />
                </svg>
                <span className="hidden sm:inline">Usuarios</span>
              </Link>
            ) : null}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vinotinto-100 text-sm font-bold text-vinotinto-800">
              {iniciales(usuario?.nombre ?? '')}
            </div>

            <button type="button" onClick={salir} className="btn-secondary px-3 py-2" title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"
                />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Consulta de constancias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Busque al estudiante por su cédula para previsualizar su expediente y generar la constancia
            en Word, PDF o para impresión.
          </p>
        </div>

        <SearchBar cedula={cedula} onChange={setCedula} onSubmit={buscar} buscando={buscando} />

        {error ? (
          <div
            role="alert"
            className="animate-fade-up rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {mensaje ? (
          <div
            role="status"
            className="animate-fade-up flex items-start gap-3 rounded-xl border border-vinotinto-200 bg-vinotinto-50 px-4 py-3 text-sm font-medium text-vinotinto-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-0.5 h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
            </svg>
            <span className="break-all">{mensaje}</span>
          </div>
        ) : null}

        {buscando ? (
          <div className="card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <svg className="h-8 w-8 animate-spin text-vinotinto-700" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Consultando expediente académico...</p>
          </div>
        ) : null}

        {!constancia && !buscando ? (
          <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vinotinto-50 text-vinotinto-500 ring-1 ring-vinotinto-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v5h5" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-800">Aún no hay un estudiante seleccionado</h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Ingrese la cédula de identidad y presione “Buscar estudiante” para visualizar el expediente
              de notas.
            </p>
          </div>
        ) : null}

        {constancia ? (
          <>
            <StudentSummary data={constancia} />

            <div className="card animate-fade-up flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vinotinto-50 text-vinotinto-700 ring-1 ring-vinotinto-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M14 2v6h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Constancia lista para generar</h3>
                  <p className="text-sm text-slate-500">
                    Descargue en Word o PDF, o abra la vista de impresión directa. El archivo se nombrará
                    <span className="font-mono text-xs text-slate-600">
                      {' '}
                      Constancia_Notas_{constancia.cedula}
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => descargar('docx')}
                  disabled={formatoActivo !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-vinotinto-200 bg-white px-4 py-3 text-sm font-bold text-vinotinto-800 shadow-sm transition hover:bg-vinotinto-50 focus:outline-none focus:ring-4 focus:ring-vinotinto-600/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formatoActivo === 'docx' ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 2v6h6" />
                    </svg>
                  )}
                  Word
                </button>

                <button
                  type="button"
                  onClick={() => descargar('pdf')}
                  disabled={formatoActivo !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-vinotinto-700 to-vinotinto-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-vinotinto-700/20 transition hover:from-vinotinto-800 hover:to-vinotinto-700 focus:outline-none focus:ring-4 focus:ring-vinotinto-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formatoActivo === 'pdf' ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                      />
                    </svg>
                  )}
                  PDF
                </button>

                <button
                  type="button"
                  onClick={imprimir}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/10"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 14h12v8H6z" />
                  </svg>
                  Imprimir
                </button>
              </div>
            </div>

            <NotesTable materias={constancia.materias} />
          </>
        ) : null}

        <footer className="pt-4 text-center text-xs text-slate-400">
          Facultad de Ciencias Económicas y Sociales · Universidad de Carabobo · Sistema interno
        </footer>
      </main>
    </div>
  );
}
