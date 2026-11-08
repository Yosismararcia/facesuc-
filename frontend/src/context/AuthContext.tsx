import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loginApi, meApi, Usuario } from '../api/client';

const TOKEN_KEY = 'facesuc_token';

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  iniciarSesion: (cedula: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function validarSesion() {
      const tokenGuardado = localStorage.getItem(TOKEN_KEY);

      if (!tokenGuardado) {
        if (activo) setCargando(false);
        return;
      }

      try {
        const usuarioValidado = await meApi(tokenGuardado);
        if (activo) {
          setToken(tokenGuardado);
          setUsuario(usuarioValidado);
        }
      } catch {
        if (activo) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUsuario(null);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void validarSesion();

    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesion = useCallback(async (cedula: string, password: string) => {
    const resultado = await loginApi(cedula, password);
    localStorage.setItem(TOKEN_KEY, resultado.token);
    setToken(resultado.token);
    setUsuario(resultado.usuario);
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, token, cargando, iniciarSesion, cerrarSesion }),
    [usuario, token, cargando, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}
