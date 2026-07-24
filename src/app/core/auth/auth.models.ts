export type MetodoAuth = 'GOOGLE' | 'CORREO';

export interface LoginRequest {
  metodo: MetodoAuth;
  idToken?: string;
  email?: string;
  contrasena?: string;
}

export interface AuthResponse {
  token: string;
  rol: string;
  estado: string;
  redirect: string;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

export interface RegistroEmpresaCorreoRequest {
  nombreAdmin: string;
  apellidosAdmin: string;
  emailAdmin: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

export interface RegistroPendienteResponse {
  mensaje: string;
  email: string;
}

export interface RegistroUsuarioCorreoRequest {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

export interface MensajeResponse {
  mensaje: string;
}

export interface ValidarTokenResetResponse {
  email: string;
}
