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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-black mb-2">No se pudo preparar la impresión</h1>
          <p className="text-sm text-slate-600">{error}</p>
          <Link to="/" className="text-black underline mt-4">
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <svg className="h-8 w-8 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
          </svg>
          <p className="text-sm font-medium">Preparando constancia para impresión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hoja de tamaño carta con márgenes exactos de la plantilla */}
      <div
        className="max-w-[8.5in] mx-auto min-h-[11in] p-[0.79in] p-x-[0.58in] font-[Arial] text-black"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Logos encabezado (misma disposición que Word) */}
        <div className="flex items-center justify-between mb-1">
          <img
            src="/logos/uc.png"
            alt="Universidad de Carabobo"
            className="h-[40pt] w-auto"
          />
          <img
            src="/logos/faces.png"
            alt="FACES"
            className="h-[40pt] w-auto"
          />
          <img
            src="/logos/faces-postgrado.png"
            alt="FACES Postgrado"
            className="h-[40pt] w-auto"
          />
        </div>

        {/* Título principal: centrado, negrita, 13pt */}
        <h1 className="text-center font-bold text-[13pt] mt-2 mb-1">
          REPORTE INTERNO DE NOTAS
        </h1>

        {/* Párrafo introductorio: justificado, normal, 11pt */}
        <p className="text-[11pt] leading-relaxed text-justify mb-1">
          Reporte interno de Notas para la ciudadana{' '}
          <span className="font-bold">{data.nombres}</span>, titular de la cedula de identidad{' '}
          <span className="font-bold">{data.cedula_formateada}</span>, cursó las siguientes asignaturas
          correspondiente al programa:
        </p>

        {/* Programa: centrado, negrita, 13pt */}
        <p className="text-center font-bold text-[13pt] mb-2">
          {data.programa}
        </p>

        {/* Tabla de materias */}
        <table className="w-full border-collapse text-[7.5pt] mb-2">
          <thead>
            <tr>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">Asignatura</th>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">Niv.</th>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">UC</th>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">Periodo</th>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">Sec.</th>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">Notas</th>
              <th className="font-bold text-center border-b border-black pb-1 pt-1">Notas en letras</th>
            </tr>
          </thead>
          <tbody>
            {data.materias.map((materia, indice) => (
              <tr key={`${materia.codigo}-${materia.periodo}-${indice}`}>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.asignatura}</td>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.nivel}</td>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.uc}</td>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.periodo}</td>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.seccion || ''}</td>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.nota}</td>
                <td className="text-center border-b border-black pb-0.5 pt-0.5">{materia.nota_letras}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabla resumen */}
        <table className="w-full border-collapse text-[8pt] mb-2">
          <tbody>
            <tr>
              <td className="font-bold text-right pr-2">Total de créditos Cursados:</td>
              <td className="font-bold text-center pl-2">{data.total_creditos}</td>
            </tr>
            <tr>
              <td className="font-bold text-right pr-2">Total de créditos Aprobados:</td>
              <td className="font-bold text-center pl-2">{data.creditos_aprobados}</td>
            </tr>
            <tr>
              <td className="font-bold text-right pr-2">Índice Académico:</td>
              <td className="font-bold text-center pl-2">{data.indice_academico}</td>
            </tr>
          </tbody>
        </table>

        {/* Profesor / Coordinación: centrado, negrita, 11pt */}
        <p className="text-center font-bold text-[11pt] mb-1">
          {data.profesor_coordinacion}
        </p>

        {/* Dirección: centrado, negrita, 10pt */}
        <p className="text-center font-bold text-[10pt] mb-2">
          Dirección de Asuntos Estudiantiles – Postgrado
        </p>

        {/* Párrafo final: centrado, normal, 13pt */}
        <p className="text-center text-[13pt]">
          Constancia que se expide a los fines que estime convenientes, en la ciudad de Valencia, a los{' '}
          <span className="font-bold">{data.fecha_actual}</span>.
        </p>
      </div>
    </div>
  );
}
