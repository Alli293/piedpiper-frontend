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
