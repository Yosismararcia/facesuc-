import { Navigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3f5]">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <svg className="h-8 w-8 animate-spin text-vinotinto-700" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
          </svg>
          <p className="text-sm font-medium">Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f3f5] lg:grid lg:grid-cols-2">
      {/* Panel institucional (escritorio) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-vinotinto-950 via-[#1a030a] to-vinotinto-900 p-8 lg:flex lg:flex-col lg:justify-between animate-gradient">
        {/* Degradado dinámico de fondo */}
        <div className="absolute inset-0 opacity-30 animate-gradient" style={{
          backgroundImage: 'linear-gradient(135deg, #7B1E3B 0%, #5A1229 30%, #7B1E3B 60%, #1a030a 100%)',
        }} />

        {/* Manchas decorativas animadas */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-vinotinto-600/20 blur-[120px] animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-rose-900/10 blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="pointer-events-none absolute top-1/3 left-10 h-48 w-48 rounded-full bg-vinotinto-400/10 blur-[80px] animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 flex flex-col h-full w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Cabecera con logos separados */}
          <header className="flex w-full items-center justify-between gap-4 mb-10">
            <img
              src="/logos/uc.png"
              alt="Universidad de Carabobo"
              className="h-12 max-h-14 w-auto object-contain drop-shadow-md"
            />
            <img
              src="/logos/faces.png"
              alt="FACES - Asuntos Estudiantiles"
              className="h-12 max-h-14 w-auto object-contain drop-shadow-md"
            />
            <img
              src="/logos/faces-postgrado.png"
              alt="FACES Postgrado"
              className="h-12 max-h-14 w-auto object-contain drop-shadow-md"
            />
          </header>

          <main className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
            {/* Título principal */}
            <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg drop-shadow-vinotinto-900/40">
                Constancias de notas de postgrado.
              </h1>
            </div>

            {/* Subtítulo */}
            <p className="md:text-lg text-vinotinto-100/90 leading-relaxed px-4 max-w-md animate-slide-up" style={{ animationDelay: '400ms' }}>
              Sistema interno de la Facultad de Ciencias Económicas y Sociales para consultar el
              expediente académico y generar la constancia oficial
            </p>

            {/* Características como tarjetas semi-transparentes */}
            <div className="w-full max-w-md flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '550ms' }}>
              <FeatureCard
                icono={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 12a9 9 0 0 1-9 9" />
                  </svg>
                }
                titulo="Búsqueda instantánea"
                descripcion="Ingrese la cédula de identidad y acceda al expediente académico de forma inmediata."
              />
              <FeatureCard
                icono={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
                titulo="Cálculo automático"
                descripcion="Créditos cursados, aprobados e índice académico se calculan sin intervención manual."
              />
              <FeatureCard
                icono={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                }
                titulo="Descarga en Word y PDF"
                descripcion="Genere la constancia oficial en su formato preferido e imprima directamente."
              />
            </div>
          </main>

          <footer className="mt-auto mb-4 text-center animate-slide-up" style={{ animationDelay: '700ms' }}>
            <p className="text-xs text-vinotinto-200/60 uppercase tracking-wider font-medium">
              Uso exclusivo del personal autorizado
            </p>
          </footer>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex min-h-screen items-center justify-center px-5 py-10 lg:min-h-0">
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="mb-8 lg:hidden">
            <div className="flex justify-center gap-2">
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-vinotinto-200 bg-white shadow-md">
                <img src="/logos/uc.png" alt="UC" className="w-full h-full object-contain" />
              </div>
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-vinotinto-200 bg-white shadow-md">
                <img src="/logos/faces.png" alt="FACES" className="w-full h-full object-contain" />
              </div>
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-vinotinto-200 bg-white shadow-md">
                <img src="/logos/faces-postgrado.png" alt="FACES Postgrado" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          <div className="card p-7 sm:p-9 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900">Acceso al sistema</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Ingrese con la cédula o correo institucional y su contraseña.
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
             Universidad de Carabobo ·Facultad de Ciencias Económicas y Sociales
          </p>
        </div>
      </main>
    </div>
  );
}

interface FeatureCardProps {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
}

function FeatureCard({ icono, titulo, descripcion }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-4 border border-white/20 bg-white/10 backdrop-blur-md text-white transition group hover:bg-white/15 hover:border-white/30">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-vinotinto-100 group-hover:bg-white/30">
        {icono}
      </div>
      <div>
        <h3 className="text-sm font-bold text-white leading-tight">{titulo}</h3>
        <p className="mt-1 text-xs text-vinotinto-100/80 leading-relaxed">{descripcion}</p>
      </div>
    </div>
  );
}
