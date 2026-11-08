import { ConstanciaData } from '../api/client';

function iniciales(nombres: string): string {
  return nombres
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export default function StudentSummary({ data }: { data: ConstanciaData }) {
  const estadisticas = [
    { etiqueta: 'Créditos cursados', valor: data.total_creditos },
    { etiqueta: 'Créditos aprobados', valor: data.creditos_aprobados },
    { etiqueta: 'Asignaturas', valor: data.total_asignaturas },
    { etiqueta: 'Índice académico', valor: data.indice_academico, destacado: true },
  ];

  return (
    <section className="card animate-fade-up overflow-hidden">
      <div className="bg-gradient-to-r from-vinotinto-800 via-vinotinto-700 to-vinotinto-600 px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/25">
            {iniciales(data.nombres)}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-vinotinto-100">
              Expediente del estudiante
            </p>
            <h2 className="mt-1 truncate text-2xl font-bold sm:text-3xl">{data.nombres}</h2>
            <p className="mt-1 text-sm text-vinotinto-50">
              {data.cedula_formateada}
              <span className="mx-2 text-vinotinto-200/60">|</span>
              {data.programa}
            </p>
            <p className="mt-1 text-xs text-vinotinto-100/90">
              Código de programa: {data.programa_codigo}
              {data.ultimo_periodo ? ` · Último período: ${data.ultimo_periodo}` : ''}
            </p>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-slate-200 border-t border-slate-200 sm:grid-cols-4 sm:divide-x">
        {estadisticas.map((estadistica) => (
          <div key={estadistica.etiqueta} className="px-5 py-4 sm:px-6">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {estadistica.etiqueta}
            </dt>
            <dd
              className={`mt-1 text-2xl font-bold ${
                estadistica.destacado ? 'text-vinotinto-700' : 'text-slate-900'
              }`}
            >
              {estadistica.valor}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
