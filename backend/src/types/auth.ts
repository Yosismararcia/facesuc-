import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';

export interface TokenPayload extends JwtPayload {
  sub: string;
  cedula: string;
  email: string | null;
  nombre: string;
  rol: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}
