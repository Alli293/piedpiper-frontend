import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CertificacionResumen } from '../../core/models/certificacion.model';
import { CertificacionesRecientesPanelComponent } from './certificaciones-recientes-panel.component';

describe('CertificacionesRecientesPanelComponent', () => {
  let fixture: ComponentFixture<CertificacionesRecientesPanelComponent>;

  const CERT_RECIENTE: CertificacionResumen = {
    id: 'c1',
    idAuditoria: 'a1',
    idEmpresa: 'e1',
    idAuditor: 'aud1',
    tipo: 'CARBONO_NEUTRAL',
    nombreCertificacion: 'Carbono Neutral 2026',
    fechaEmision: '2026-08-01T00:00:00Z',
    fechaVencimiento: '2027-08-01T00:00:00Z',
    estado: 'ACTIVA',
    vigente: true,
    urlVerificacion: 'https://example.cr/verificar/c1',
    codigoVerificacion: 'CH-2026-AAAA1111',
  };

  const CERT_ANTIGUA: CertificacionResumen = {
    id: 'c2',
    idAuditoria: 'a2',
    idEmpresa: 'e1',
    idAuditor: 'aud1',
    tipo: 'INVENTARIO_GEI',
    nombreCertificacion: 'Inventario GEI 2025',
    fechaEmision: '2025-05-10T00:00:00Z',
    fechaVencimiento: '2026-05-10T00:00:00Z',
    estado: 'ACTIVA',
    vigente: false,
    urlVerificacion: 'https://example.cr/verificar/c2',
    codigoVerificacion: 'CH-2025-BBBB2222',
  };

  async function createFixture(): Promise<
    ComponentFixture<CertificacionesRecientesPanelComponent>
  > {
    await TestBed.configureTestingModule({
      imports: [CertificacionesRecientesPanelComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const created = TestBed.createComponent(CertificacionesRecientesPanelComponent);
    created.detectChanges();
    return created;
  }

  it('renderiza las certificaciones ordenadas por fecha de emisión descendente, con nombre y vigencia', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('certificaciones', [CERT_ANTIGUA, CERT_RECIENTE]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const nombres = Array.from(
      el.querySelectorAll('.ch-cert-recientes-panel__item-copy strong')
    ).map((n) => n.textContent?.trim());
    expect(nombres).toEqual(['Carbono Neutral 2026', 'Inventario GEI 2025']);

    const vigencias = Array.from(el.querySelectorAll('.ch-cert-recientes-panel__badge')).map((n) =>
      n.textContent?.trim()
    );
    expect(vigencias).toEqual(['Vigente', 'Vencida']);
  });

  it('muestra como máximo 4 certificaciones, las más recientes', async () => {
    fixture = await createFixture();
    const certificaciones = Array.from({ length: 6 }, (_, i) => ({
      ...CERT_RECIENTE,
      id: `c${i}`,
      nombreCertificacion: `Certificación ${i}`,
      fechaEmision: `2026-0${(i % 9) + 1}-01T00:00:00Z`,
    }));
    fixture.componentRef.setInput('certificaciones', certificaciones);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.ch-cert-recientes-panel__item').length).toBe(4);
  });

  it('muestra el mensaje de vacío cuando la lista está vacía', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('certificaciones', []);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-cert-recientes-panel__vacio')?.textContent).toContain(
      'Aún no tienes certificaciones registradas'
    );
  });

  it('cada certificación es un enlace a su vista de detalle', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput('certificaciones', [CERT_RECIENTE]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('.ch-cert-recientes-panel__item') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toContain('/empresa/certificaciones/listado');
    expect(enlace.getAttribute('href')).toContain('id=c1');
  });

  it('"Ver todas" enlaza al listado completo de certificaciones', async () => {
    fixture = await createFixture();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const enlace = el.querySelector('.ch-cert-recientes-panel__ver-todas') as HTMLAnchorElement;
    expect(enlace.getAttribute('href')).toBe('/empresa/certificaciones/listado');
  });

  it('muestra el mensaje de error cuando falla la carga', async () => {
    fixture = await createFixture();
    fixture.componentRef.setInput(
      'error',
      'No fue posible cargar esta sección. Intenta recargar la página.'
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-cert-recientes-panel__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
  });
});
