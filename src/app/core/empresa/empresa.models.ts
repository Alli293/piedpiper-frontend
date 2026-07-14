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
