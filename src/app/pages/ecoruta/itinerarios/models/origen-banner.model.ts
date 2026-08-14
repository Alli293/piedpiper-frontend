export interface BannerOrigen {
  nombrePais: string | null;
  banderaEmoji: string | null;
  banderaUrlSvg: string | null;
  codigoIso: string;
}

export interface EstablecimientoBannerResponse {
  banner: BannerOrigen | null;
}
