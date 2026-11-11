interface InstitutionLogosProps {
  compact?: boolean;
  light?: boolean;
  className?: string;
}

export default function InstitutionLogos({
  compact = false,
  light = false,
  className = '',
}: InstitutionLogosProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logos/uc.png"
        alt="Logo de la Universidad de Carabobo"
        className={`w-auto object-contain ${compact ? 'h-11' : 'h-16'}`}
      />

      <div className="min-w-0">
        <p
          className={`font-bold uppercase tracking-[0.18em] ${
            light ? 'text-vinotinto-100' : 'text-vinotinto-800'
          } ${compact ? 'text-xs sm:text-sm' : 'text-base'}`}
        >
          FACES · UC
        </p>
        <p className={`${light ? 'text-vinotinto-200/80' : 'text-slate-500'} ${compact ? 'text-[11px]' : 'text-sm'}`}>
          Constancias de Notas
        </p>
      </div>

      <img
        src="/logos/faces.png"
        alt="Logo de la Facultad de Ciencias Económicas y Sociales"
        className={`w-auto object-contain ${
          compact ? 'hidden h-8 sm:block' : 'h-12'
        }`}
      />

      <img
        src="/logos/faces-postgrado.png"
        alt="Logo de FACES Postgrado"
        className={`w-auto object-contain ${
          compact ? 'hidden h-8 sm:block' : 'h-10'
        }`}
      />
    </div>
  );
}
