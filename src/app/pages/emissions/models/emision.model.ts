export type UnidadElectricidad = 'kwh' | 'mwh';

export interface RegistrarElectricidadRequest {
  readonly titulo: string;
  readonly electricityValue: number;
  readonly electricityUnit: UnidadElectricidad;
  readonly fechaActividad: string;
}

export interface EmisionResponse {
  readonly id: string;
  readonly categoria: string;
  readonly titulo: string;
  readonly fechaActividad: string;
  readonly electricityValue: number;
  readonly electricityUnit: UnidadElectricidad;
  readonly carbonKg: number;
  readonly carbonMt: number;
  readonly factorEmisionId: string;
  readonly estimatedAt: string;
  readonly createdAt: string;
}

export interface ApiErrorResponse {
  readonly status: number;
  readonly message: string;
  readonly timestamp: string;
}
