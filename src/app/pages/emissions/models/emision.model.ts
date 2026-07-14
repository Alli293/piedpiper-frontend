export type UnidadElectricidad = 'kwh' | 'mwh';

export type UnidadPeso = 'G' | 'LB' | 'KG' | 'MT';
export type UnidadDistancia = 'KM' | 'MI';
export type MetodoTransporte = 'SHIP' | 'TRAIN' | 'TRUCK' | 'PLANE';

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

export interface RegistrarEnvioRequest {
  readonly titulo: string;
  readonly weightValue: number;
  readonly weightUnit: UnidadPeso;
  readonly distanceValue: number;
  readonly distanceUnit: UnidadDistancia;
  readonly transportMethod: MetodoTransporte;
  readonly fechaActividad: string;
}

export interface EmisionEnvioResponse {
  readonly id: string;
  readonly categoria: string;
  readonly titulo: string;
  readonly fechaActividad: string;
  readonly weightValue: number;
  readonly weightUnit: UnidadPeso;
  readonly distanceValue: number;
  readonly distanceUnit: UnidadDistancia;
  readonly transportMethod: MetodoTransporte;
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
