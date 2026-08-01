export type SectorIndustrial =
  'HOTELERIA' | 'AGROINDUSTRIA' | 'TRANSPORTE' | 'MANUFACTURA' | 'SERVICIOS' | 'RETAIL' | 'OTRO';

export interface ConfiguracionInicialEmpresaRequest {
  nombreEmpresa: string;
  cedulaJuridica: string;
  sectorIndustrial: SectorIndustrial;
  pais: string;
  cantidadEmpleados: number;
  descripcion?: string;
}

export interface ConfiguracionInicialEmpresaResponse {
  empresaId: string;
  nombreEmpresa: string;
  slug: string;
  documentosPendientes: boolean;
  recienCreada: boolean;
}

export type NivelInsigniaEmpresa = 'bronce' | 'plata' | 'oro';

export interface InsigniaEmpresa {
  readonly idInsignia: number;
  readonly nivelInsignia: NivelInsigniaEmpresa;
  readonly nombre: string;
  readonly descripcion: string;
  readonly fechaObtencion: string;
}
