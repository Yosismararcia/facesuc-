import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, ConstanciaData, obtenerConstancia } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PrintConstanciaPage() {
  const { cedula } = useParams<{ cedula: string }>();
  const { token } = useAuth();

  const [data, setData] = useState<ConstanciaData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      if (!cedula || !token) return;

      try {
        const resultado = await obtenerConstancia(cedula, token);
        if (activo) setData(resultado);
      } catch (err) {
        if (activo) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'No fue posible cargar la constancia para imprimir.',
          );
        }
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [cedula, token]);

  useEffect(() => {
    if (!data) return;

    const temporizador = window.setTimeout(() => {
      window.print();
    }, 700);

    return () => window.clearTimeout(temporizador);
  }, [data]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-slate-900">No se pudo preparar la impresión</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link to="/" className="btn-primary mt-5">
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <svg className="h-8 w-8 animate-spin text-vinotinto-700" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
          </svg>
          <p className="text-sm font-medium">Preparando constancia para impresión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-[210mm] print:max-w-none">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link to="/" className="btn-secondary">
            Volver al panel
          </Link>
          <button type="button" onClick={() => window.print()} className="btn-primary">
            Imprimir de nuevo
          </button>
        </div>

        <article
          className="bg-white p-[14mm] shadow-xl print:p-0 print:shadow-none font-black"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <header className="flex items-center justify-between gap-4 border-b-4 border-vinotinto-700 pb-4">
            <img
              src="/logos/uc.png"
              alt="Universidad de Carabobo"
              className="h-20 w-auto object-contain"
            />

            <div className="min-w-0 text-center">
              <p className="text-base font-bold text-vinotinto-700">UNIVERSIDAD DE CARABOBO</p>
              <p className="text-[11px] font-black text-vinotinto-900">
                FACULTAD DE CIENCIAS ECONÓMICAS Y SOCIALES
              </p>
              <p className="text-[10px] font-bold text-slate-500">COORDINACIÓN DE POSTGRADO</p>
              <p className="mt-2 text-xl font-black text-vinotinto-900 underline">CONSTANCIA DE NOTAS</p>
            </div>

            <img
              src="/logos/faces.png"
              alt="FACES"
              className="h-14 w-auto object-contain"
            />
          </header>

          <div className="mt-5 space-y-1 text-[11px] leading-relaxed text-slate-800 font-black">
            <p className="text-justify">
              Quien suscribe, en su carácter de autoridad académica de la Coordinación de Postgrado de la
              Facultad de Ciencias Económicas y Sociales de la Universidad de Carabobo, hace constar que el
              (la) ciudadano(a){' '}
              <strong className="text-vinotinto-900 font-black">{data.nombres}</strong>, titular de la Cédula de
              Identidad <strong className="font-black">{data.cedula_formateada}</strong>, cursó y aprobó las asignaturas que se
              indican a continuación:
            </p>
            <p>
              <strong className="text-vinotinto-800 font-black">Programa:</strong>{' '}
              <span className="font-black">{data.programa}</span> (Código{' '}
              <span className="font-black">{data.programa_codigo}</span>)
            </p>
          </div>

          <table className="mt-4 w-full border-collapse text-[9px] font-black">
            <thead>
              <tr className="bg-vinotinto-700 text-white font-black">
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-left font-black">Código</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-left font-black">Asignatura</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-center font-black">UC</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-center font-black">Período</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-center font-black">Sección</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-center font-black">Nota</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-left font-black">En letras</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-center font-black">Aprobada</th>
                <th className="border border-vinotinto-800 px-1.5 py-1.5 text-left font-black">Profesor</th>
              </tr>
            </thead>
            <tbody>
              {data.materias.map((materia, indice) => (
                <tr key={`${materia.codigo}-${materia.periodo}-${indice}`} className={indice % 2 ? 'bg-vinotinto-50' : 'bg-white'}>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 font-mono text-[8px] text-slate-700 font-black">
                    {materia.codigo}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-slate-800 font-black">
                    {materia.asignatura}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-center text-slate-800 font-black">
                    {materia.uc}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-center text-slate-800 font-black">
                    {materia.periodo}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-center text-slate-800 font-black">
                    {materia.seccion || '—'}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-center font-black text-slate-900">
                    {materia.nota}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-slate-700 font-black">
                    {materia.nota_letras}
                  </td>
                  <td className={`border border-vinotinto-200 px-1.5 py-1.5 text-center font-black ${materia.aprobada === 'SI' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {materia.aprobada}
                  </td>
                  <td className="border border-vinotinto-200 px-1.5 py-1.5 text-slate-700 font-black">
                    {materia.profesor || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 text-[11px] text-slate-800 font-black">
            <p>
              <strong className="text-vinotinto-800 font-black">Total de asignaturas:</strong>{' '}
              <span className="font-black">{data.total_asignaturas}</span>
            </p>
            <p>
              <strong className="text-vinotinto-800 font-black">Créditos cursados:</strong>{' '}
              <span className="font-black">{data.total_creditos}</span>
            </p>
            <p>
              <strong className="text-vinotinto-800 font-black">Créditos aprobados:</strong>{' '}
              <span className="font-black">{data.creditos_aprobados}</span>
            </p>
            <p>
              <strong className="text-vinotinto-800 font-black">Índice académico:</strong>{' '}
              <span className="font-black">{data.indice_academico}</span>
            </p>
          </div>

          <p className="mt-4 text-justify text-[11px] leading-relaxed text-slate-800 font-black">
            Constancia que se expide a los fines que estime convenientes, en la ciudad de Valencia, a los{' '}
            <span className="font-black">{data.fecha_actual}</span>.
          </p>

          <div className="mt-16 text-center text-[11px] text-slate-800 font-black">
            <div className="mx-auto w-56 border-t border-slate-700 pt-2">
              <p className="font-black text-vinotinto-900">Coordinación de Postgrado</p>
              <p className="text-[10px] font-bold text-slate-500">FACES - Universidad de Carabobo</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
