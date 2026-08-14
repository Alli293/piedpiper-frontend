import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BannerOrigen } from '../models/origen-banner.model';
import { OrigenBannerComponent } from './origen-banner.component';

const BANNER_MOCK: BannerOrigen = {
  nombrePais: 'Costa Rica',
  banderaEmoji: '🇨🇷',
  banderaUrlSvg: 'https://flagcdn.com/cr.svg',
  codigoIso: 'CR',
};

describe('OrigenBannerComponent', () => {
  function crearFixture(banner: BannerOrigen | null): ComponentFixture<OrigenBannerComponent> {
    const fixture = TestBed.configureTestingModule({
      imports: [OrigenBannerComponent],
    }).createComponent(OrigenBannerComponent);

    fixture.componentRef.setInput('banner', banner);
    fixture.detectChanges();
    return fixture;
  }

  it('no renderiza nada cuando banner es null', () => {
    const fixture = crearFixture(null);

    expect(fixture.nativeElement.querySelector('.ch-origen-banner')).toBeNull();
  });

  it('muestra la bandera SVG cuando banderaUrlSvg está presente', () => {
    const fixture = crearFixture(BANNER_MOCK);

    const img = fixture.nativeElement.querySelector('.ch-origen-banner__bandera');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://flagcdn.com/cr.svg');
    expect(fixture.nativeElement.querySelector('.ch-origen-banner__emoji')).toBeNull();
  });

  it('muestra el nombre del país junto a la bandera', () => {
    const fixture = crearFixture(BANNER_MOCK);

    expect(fixture.nativeElement.textContent).toContain('Costa Rica');
  });

  it('muestra el emoji como fallback si la imagen SVG falla', () => {
    const fixture = crearFixture(BANNER_MOCK);

    const img = fixture.nativeElement.querySelector('.ch-origen-banner__bandera');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ch-origen-banner__bandera')).toBeNull();
    const emoji = fixture.nativeElement.querySelector('.ch-origen-banner__emoji');
    expect(emoji).not.toBeNull();
    expect(emoji.textContent).toContain('🇨🇷');
  });

  it('muestra el emoji directamente cuando no hay banderaUrlSvg', () => {
    const fixture = crearFixture({ ...BANNER_MOCK, banderaUrlSvg: null });

    expect(fixture.nativeElement.querySelector('.ch-origen-banner__bandera')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ch-origen-banner__emoji')).not.toBeNull();
  });

  it('muestra solo el nombre en texto cuando no hay ni SVG ni emoji', () => {
    const fixture = crearFixture({ ...BANNER_MOCK, banderaUrlSvg: null, banderaEmoji: null });

    expect(fixture.nativeElement.querySelector('.ch-origen-banner__bandera')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ch-origen-banner__emoji')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Costa Rica');
  });
});
