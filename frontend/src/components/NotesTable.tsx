import { MateriaConstancia } from '../api/client';

interface NotesTableProps {
  materias: MateriaConstancia[];
}

export default function NotesTable({ materias }: NotesTableProps) {
  return (
    <section className="card animate-fade-up overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Expediente de notas</h3>
          <p className="text-sm text-slate-500">Asignaturas registradas en el histórico académico.</p>
        </div>
        <span className="rounded-full bg-vinotinto-50 px-3 py-1 text-xs font-semibold text-vinotinto-800 ring-1 ring-inset ring-vinotinto-100">
          {materias.length} {materias.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-vinotinto-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-vinotinto-800">Código</th>
              <th className="min-w-[220px] px-4 py-3 font-semibold text-vinotinto-800">Asignatura</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-vinotinto-800">UC</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-vinotinto-800">Período</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-vinotinto-800">Sección</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-vinotinto-800">Nota</th>
              <th className="hidden whitespace-nowrap px-4 py-3 font-semibold text-vinotinto-800 lg:table-cell">
                En letras
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold text-vinotinto-800">Estado</th>
              <th className="hidden whitespace-nowrap px-4 py-3 font-semibold text-vinotinto-800 xl:table-cell">
                Profesor
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {materias.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                  El estudiante no tiene notas registradas.
                </td>
              </tr>
            ) : (
              materias.map((materia, indice) => {
                const aprobada = materia.aprobada === 'SI';
                return (
                  <tr key={`${materia.codigo}-${materia.periodo}-${indice}`} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                      {materia.codigo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{materia.asignatura}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-700">{materia.uc}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-700">
                      {materia.periodo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-slate-700">
                      {materia.seccion || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-base font-bold text-slate-900">
                      {materia.nota}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 lg:table-cell">
                      {materia.nota_letras}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          aprobada
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200'
                        }`}
                      >
                        {aprobada ? 'Aprobada' : 'Reprobada'}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 xl:table-cell">
                      {materia.profesor || '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
