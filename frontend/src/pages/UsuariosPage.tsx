import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  actualizarUsuario,
  ApiError,
  crearUsuario,
  listarUsuarios,
  UsuarioListado,
} from '../api/client';
import InstitutionLogos from '../components/InstitutionLogos';
import { useAuth } from '../context/AuthContext';

type Rol = 'ROOT' | 'ADMIN';

interface FormularioUsuario {
  cedula: string;
  nombre: string;
  password: string;
  rol: Rol;
  activo: boolean;
}

const FORMULARIO_VACIO: FormularioUsuario = {
  cedula: '',
  nombre: '',
  password: '',
  rol: 'ADMIN',
  activo: true,
};

export default function UsuariosPage() {
  const { token, usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<UsuarioListado | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>(FORMULARIO_VACIO);

  const cargarUsuarios = useCallback(async () => {
    if (!token) return;

    setCargando(true);
    setError('');

    try {
      setUsuarios(await listarUsuarios(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No fue posible cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  function abrirCrear() {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setError('');
    setModalAbierto(true);
  }

  function abrirEditar(item: UsuarioListado) {
    setEditando(item);
    setFormulario({
      cedula: item.cedula,
      nombre: item.nombre,
      password: '',
      rol: item.rol,
      activo: item.activo,
    });
    setError('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!token) return;

    setError('');
    setMensaje('');

    const digitos = formulario.cedula.replace(/\D/g, '');

    if (!editando && !/^\d{5,9}$/.test(digitos)) {
      setError('Ingrese una cédula válida (entre 5 y 9 dígitos).');
      return;
    }

    if (formulario.nombre.trim().length < 3) {
      setError('Ingrese el nombre completo del usuario.');
      return;
    }

    if ((!editando || formulario.password) && formulario.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setGuardando(true);

    try {
      if (editando) {
        await actualizarUsuario(token, editando.id, {
          nombre: formulario.nombre.trim(),
          rol: formulario.rol,
          activo: formulario.activo,
          ...(formulario.password ? { password: formulario.password } : {}),
        });
        setMensaje('Usuario actualizado correctamente.');
      } else {
        await crearUsuario(token, {
          cedula: digitos,
          nombre: formulario.nombre.trim(),
          password: formulario.password,
          rol: formulario.rol,
        });
        setMensaje('Usuario creado correctamente.');
      }

      setModalAbierto(false);
      setEditando(null);
      await cargarUsuarios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No fue posible guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(item: UsuarioListado) {
    if (!token) return;

    setError('');
    setMensaje('');

    try {
      await actualizarUsuario(token, item.id, { activo: !item.activo });
      setMensaje(item.activo ? 'Usuario desactivado.' : 'Usuario activado.');
      await cargarUsuarios();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No fue posible cambiar el estado.');
    }
  }

  function salir() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f7f3f5]">
      <header className="sticky top-0 z-20 border-b border-vinotinto-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <InstitutionLogos compact />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">{usuario?.nombre}</p>
              <p className="text-xs text-slate-500">ROOT · C.I. {usuario?.cedula}</p>
            </div>
            <Link to="/" className="btn-secondary px-3 py-2" title="Volver al panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M19 12H5m0 0 6-6m-6 6 6 6"
                />
              </svg>
              <span className="hidden sm:inline">Panel</span>
            </Link>
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Usuarios del sistema</h1>
            <p className="mt-1 text-sm text-slate-500">
              Solo el rol ROOT puede crear administradores y controlar el acceso al sistema.
            </p>
          </div>
          <button type="button" onClick={abrirCrear} className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
            </svg>
            Nuevo usuario
          </button>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        {mensaje ? (
          <div role="status" className="rounded-xl border border-vinotinto-200 bg-vinotinto-50 px-4 py-3 text-sm font-medium text-vinotinto-800">
            {mensaje}
          </div>
        ) : null}

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-vinotinto-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Cuentas registradas</h2>
              <p className="text-sm text-slate-500">Altas, roles, estado y contraseñas de acceso.</p>
            </div>
            <span className="rounded-full bg-vinotinto-50 px-3 py-1 text-xs font-semibold text-vinotinto-800 ring-1 ring-inset ring-vinotinto-100">
              {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm font-medium text-slate-600">
              <svg className="h-5 w-5 animate-spin text-vinotinto-700" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
              </svg>
              Cargando usuarios...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-vinotinto-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-vinotinto-800">Nombre</th>
                    <th className="px-4 py-3 font-semibold text-vinotinto-800">Cédula</th>
                    <th className="px-4 py-3 font-semibold text-vinotinto-800">Rol</th>
                    <th className="px-4 py-3 font-semibold text-vinotinto-800">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold text-vinotinto-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {usuarios.map((item) => (
                    <tr key={item.id} className="hover:bg-vinotinto-50/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.nombre}</p>
                        <p className="text-xs text-slate-500">
                          Creado el {new Date(item.creadoEn).toLocaleDateString('es-VE')}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                        {item.cedula}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            item.rol === 'ROOT'
                              ? 'bg-vinotinto-700 text-white'
                              : 'bg-vinotinto-50 text-vinotinto-800 ring-1 ring-inset ring-vinotinto-200'
                          }`}
                        >
                          {item.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.activo
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                              : 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200'
                          }`}
                        >
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => abrirEditar(item)}
                          className="mr-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-vinotinto-800 transition hover:bg-vinotinto-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void cambiarEstado(item)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          {item.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {modalAbierto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editando ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editando
                    ? 'Actualice los datos, el rol o el estado de la cuenta.'
                    : 'Cree una cuenta ADMIN o ROOT para el personal autorizado.'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="usuario-cedula" className="label">
                    Cédula
                  </label>
                  <input
                    id="usuario-cedula"
                    type="text"
                    inputMode="numeric"
                    className="input"
                    value={formulario.cedula}
                    onChange={(evento) =>
                      setFormulario((actual) => ({ ...actual, cedula: evento.target.value }))
                    }
                    disabled={Boolean(editando) || guardando}
                    placeholder="Ej. 12345678"
                  />
                </div>

                <div>
                  <label htmlFor="usuario-rol" className="label">
                    Rol
                  </label>
                  <select
                    id="usuario-rol"
                    className="input"
                    value={formulario.rol}
                    onChange={(evento) =>
                      setFormulario((actual) => ({ ...actual, rol: evento.target.value as Rol }))
                    }
                    disabled={guardando}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="ROOT">ROOT</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="usuario-nombre" className="label">
                  Nombre completo
                </label>
                <input
                  id="usuario-nombre"
                  type="text"
                  className="input"
                  value={formulario.nombre}
                  onChange={(evento) =>
                    setFormulario((actual) => ({ ...actual, nombre: evento.target.value }))
                  }
                  disabled={guardando}
                  placeholder="Ej. Prof. María Fernández"
                />
              </div>

              <div>
                <label htmlFor="usuario-password" className="label">
                  Contraseña {editando ? '(opcional)' : ''}
                </label>
                <input
                  id="usuario-password"
                  type="password"
                  className="input"
                  value={formulario.password}
                  onChange={(evento) =>
                    setFormulario((actual) => ({ ...actual, password: evento.target.value }))
                  }
                  disabled={guardando}
                  placeholder={editando ? 'Dejar vacío para mantener la actual' : 'Mínimo 6 caracteres'}
                  autoComplete="new-password"
                />
              </div>

              {editando ? (
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-vinotinto-700 focus:ring-vinotinto-600"
                    checked={formulario.activo}
                    onChange={(evento) =>
                      setFormulario((actual) => ({ ...actual, activo: evento.target.checked }))
                    }
                    disabled={guardando}
                  />
                  Usuario activo
                </label>
              ) : null}

              {error ? (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="btn-secondary" disabled={guardando}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
