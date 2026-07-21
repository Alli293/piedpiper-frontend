export type UnidadElectricidad = 'kwh' | 'mwh';
export type CabinClass = 'economy' | 'premium';
export type CategoriaFiltroEmision = 'TODAS' | 'ELECTRICIDAD' | 'FLOTA' | 'VUELO' | 'ENVIO';
export type EstadoComparacion = 'dentro' | 'cerca' | 'superado' | 'sin_limite';

export type UnidadPeso = 'G' | 'LB' | 'KG' | 'MT';
// El backend serializa UnidadDistancia en minúscula (@JsonValue) para vuelo, envío y flota.
export type UnidadDistancia = 'km' | 'mi';
export type MetodoTransporte = 'SHIP' | 'TRAIN' | 'TRUCK' | 'PLANE';

export interface RegistrarElectricidadRequest {
  readonly titulo: string;
  readonly electricityValue: number;
  readonly electricityUnit: UnidadElectricidad;
  readonly fechaActividad: string;
}

export interface RegistrarVueloLegRequest {
  readonly departureAirport: string;
  readonly destinationAirport: string;
  readonly cabinClass: CabinClass;
}

export interface RegistrarVueloRequest {
  readonly passengers: number;
  readonly legs: RegistrarVueloLegRequest[];
  readonly distanceUnit: UnidadDistancia;
  readonly fechaActividad: string;
}

export interface EmisionResponse {
  readonly id: string;
  readonly categoria: string;
  readonly titulo: string;
  readonly fechaActividad: string;
  readonly electricityValue?: number;
  readonly electricityUnit?: UnidadElectricidad;
  readonly passengers?: number;
  readonly legs?: RegistrarVueloLegRequest[];
  readonly tipoVehiculo?: string;
  readonly combustible?: string;
  readonly weightValue?: number;
  readonly weightUnit?: UnidadPeso;
  readonly transportMethod?: MetodoTransporte;
  readonly distanceUnit?: UnidadDistancia;
  readonly distanceValue?: number;
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

export interface CombustibleOption {
  readonly id: string;
  readonly nombre: string;
}

export interface TipoVehiculoOption {
  readonly id: string;
  readonly nombre: string;
  readonly combustibles: CombustibleOption[];
}

export interface RegistrarFlotaRequest {
  readonly titulo: string;
  readonly tipoVehiculo: string;
  readonly combustible: string;
  readonly distanceValue: number;
  readonly distanceUnit: UnidadDistancia;
  readonly fechaActividad: string;
}

export interface EmisionFlotaResponse {
  readonly id: string;
  readonly categoria: string;
  readonly titulo: string;
  readonly fechaActividad: string;
  readonly tipoVehiculo: string;
  readonly combustible: string;
  readonly distanceValue: number;
  readonly distanceUnit: UnidadDistancia;
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

export interface ComparacionEmisionesResponse {
  readonly anio: number;
  readonly huellaAcumuladaT: number;
  readonly limiteT: number | null;
  readonly porcentajeConsumido: number | null;
  readonly estado: EstadoComparacion;
  readonly mensaje: string | null;
}

export type CategoriaResumen = 'ELECTRICIDAD' | 'FLOTA' | 'VUELO' | 'ENVIO';

export interface ResumenCategoriaResponse {
  readonly categoria: CategoriaResumen;
  readonly totalKg: number;
  readonly porcentaje: number;
}

export interface ResumenEmisionesResponse {
  readonly anio: number;
  readonly mes: number | null;
  readonly totalKg: number;
  readonly totalT: number;
  readonly categorias: ResumenCategoriaResponse[];
}
