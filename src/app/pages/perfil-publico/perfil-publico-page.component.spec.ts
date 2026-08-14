import { Component, input } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { EvolucionHuellaChartComponent } from './evolucion-huella-chart.component';
import { EvolucionHuellaDTO, PerfilPublicoDTO, PuntoHuella } from './perfil-publico.models';
import { PerfilPublicoPageComponent } from './perfil-publico-page.component';
import { PerfilPublicoService } from './perfil-publico.service';

@Component({ selector: 'app-icon', template: '', standalone: true })
class IconStubComponent {
  name = input.required<string>();
  size = input(16);
}

@Component({ selector: 'app-evolucion-huella-chart', template: '', standalone: true })
class EvolucionHuellaChartStubComponent {
  serie = input<PuntoHuella[]>([]);
}

const PERFIL_MOCK: PerfilPublicoDTO = {
  nombreEmpresa: 'EcoTech Solutions',
  logoUrl: 'https://example.com/logo.png',
  sectorIndustrial: 'Tecnologia',
  pais: 'Costa Rica',
  nivelEcologico: 'Oro',
  fechaActualizacionNivel: '2025-03-15T14:30:00Z',
  certificacionesVigentes: 5,
  insigniasActivas: 3,
};

const EVOLUCION_MOCK: EvolucionHuellaDTO = {
  rangoPeriodo: 'ultimos_3_anios',
  tendencia: 'reduccion',
  serie: [
    { periodo: '2025', huellaT: 5.236, variacionPorcentual: null },
    { periodo: '2026', huellaT: 4.2, variacionPorcentual: -19.8 },
  ],
};

describe('PerfilPublicoPageComponent', () => {
  let fixture: ComponentFixture<PerfilPublicoPageComponent>;
  let component: PerfilPublicoPageComponent;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilPublicoPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        PerfilPublicoService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (_key: string) => 'eco-tech' } },
          },
        },
      ],
    })
      .overrideComponent(PerfilPublicoPageComponent, {
        remove: {
          imports: [IconComponent, EvolucionHuellaChartComponent],
        },
        add: {
          imports: [IconStubComponent, EvolucionHuellaChartStubComponent],
        },
      })
      .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PerfilPublicoPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.match(() => true);
  });

  function flushPerfil(dto: PerfilPublicoDTO, huella: EvolucionHuellaDTO = EVOLUCION_MOCK): void {
    httpMock.expectOne(`${baseUrl}/eco-tech`).flush(dto);
    fixture.detectChanges();
    httpMock.match(`${baseUrl}/eco-tech/certificaciones`).forEach((r) => r.flush([]));
    httpMock.match(`${baseUrl}/eco-tech/insignias`).forEach((r) => r.flush([]));
    httpMock.match(`${baseUrl}/eco-tech/evolucion-huella?rango=ultimos_3_anios`).forEach((r) => {
      r.flush(huella);
    });
    fixture.detectChanges();
  }

  function flushError(status: number, body: object): void {
    httpMock.expectOne(`${baseUrl}/eco-tech`).flush(body, { status, statusText: 'Error' });
    fixture.detectChanges();
  }

  it('muestra spinner durante estado de carga', () => {
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-loading__spinner')).not.toBeNull();
    expect(el.querySelector('.pub-loading__text')?.textContent).toContain('Cargando perfil');
  });

  it('renderiza nombre, pais y nivel cuando la data carga exitosamente', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-card__nombre')?.textContent).toContain('EcoTech Solutions');
    expect(el.querySelector('.pub-nivel__nombre')?.textContent).toContain('Oro');
    expect(el.textContent).toContain('Costa Rica');
  });

  it('renderiza pagina 404 cuando ocurre un error 404', () => {
    fixture.detectChanges();
    flushError(404, { mensaje: 'El perfil que buscas no existe o ya no esta disponible.' });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-error--404')).not.toBeNull();
    expect(el.querySelector('.pub-error__msg')?.textContent).toContain(
      'El perfil que buscas no existe'
    );
  });

  it.each([
    { input: 'ORO', expected: 'Oro', cssClass: 'pub-nivel--oro' },
    { input: 'PLATA', expected: 'Plata', cssClass: 'pub-nivel--plata' },
    { input: 'BRONCE', expected: 'Bronce', cssClass: 'pub-nivel--bronce' },
    { input: 'PLATINO', expected: 'Platino', cssClass: 'pub-nivel--platino' },
  ])('normaliza $input a $expected y aplica $cssClass', ({ input, expected, cssClass }) => {
    fixture.detectChanges();
    flushPerfil({ ...PERFIL_MOCK, nivelEcologico: input });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector(`.${cssClass}`)).not.toBeNull();
    expect(el.querySelector('.pub-nivel__nombre')?.textContent).toContain(expected);
  });

  it('muestra la vigencia cuando hay nivel y fecha de actualizacion', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-nivel__vigencia')?.textContent).toContain('Vigente 2025');
  });

  it('oculta la vigencia cuando el nivel es Sin nivel', () => {
    fixture.detectChanges();
    flushPerfil({ ...PERFIL_MOCK, nivelEcologico: '', fechaActualizacionNivel: null });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-nivel__nombre')?.textContent).toContain('Sin nivel');
    expect(el.querySelector('.pub-nivel__vigencia')).toBeNull();
  });

  it('oculta la vigencia cuando hay nivel pero no hay fecha de actualizacion', () => {
    fixture.detectChanges();
    flushPerfil({ ...PERFIL_MOCK, fechaActualizacionNivel: null });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-nivel__nombre')?.textContent).toContain('Oro');
    expect(el.querySelector('.pub-nivel__vigencia')).toBeNull();
  });

  it('no muestra el boton de compartir del header mientras el perfil esta cargando', () => {
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-public-header__compartir')).toBeNull();
  });

  it('abre el modal de compartir perfil al hacer clic en compartir del header', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const el = fixture.nativeElement as HTMLElement;
    const botonCompartir: HTMLElement | null = el.querySelector('.ch-public-header__compartir');
    expect(botonCompartir).not.toBeNull();

    botonCompartir!.click();
    fixture.detectChanges();

    expect(el.querySelector('.pub-modal__title')?.textContent).toContain('Compartir perfil');
  });

  it('muestra grafico y tendencia cuando hay varios periodos verificados', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-evolucion-huella-chart')).not.toBeNull();
    expect(el.querySelector('.pub-huella__total')?.textContent).toContain('4,2 tCO');
    expect(el.querySelector('.pub-huella__trend')?.textContent).toContain('Disminu');
  });

  it('muestra aviso de historial insuficiente con un solo periodo', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK, {
      rangoPeriodo: 'ultimo_anio',
      tendencia: 'sin_cambio',
      serie: [{ periodo: '2026', huellaT: 5.236, variacionPorcentual: null }],
    });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Aún no hay suficiente historial para mostrar una tendencia.');
    expect(el.querySelector('app-evolucion-huella-chart')).not.toBeNull();
  });

  it('muestra mensaje normal cuando no hay datos verificados', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK, {
      rangoPeriodo: 'ultimos_3_anios',
      tendencia: 'sin_cambio',
      serie: [],
    });

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain(
      'Esta empresa aún no cuenta con periodos de huella de carbono verificados por un'
    );
    expect(el.querySelector('app-evolucion-huella-chart')).toBeNull();
  });

  it('muestra error inline cuando falla la evolucion sin romper el perfil', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${baseUrl}/eco-tech`).flush(PERFIL_MOCK);
    httpMock.match(`${baseUrl}/eco-tech/certificaciones`).forEach((r) => r.flush([]));
    httpMock.match(`${baseUrl}/eco-tech/insignias`).forEach((r) => r.flush([]));
    httpMock
      .expectOne(`${baseUrl}/eco-tech/evolucion-huella?rango=ultimos_3_anios`)
      .flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-card__nombre')?.textContent).toContain('EcoTech Solutions');
    expect(el.textContent).toContain(
      'No fue posible cargar la evolución de la huella de carbono en este momento.'
    );
  });

  it('recarga la huella al cambiar el rango', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const botones = fixture.nativeElement.querySelectorAll(
      '.pub-huella__filter'
    ) as NodeListOf<HTMLButtonElement>;
    botones[2].click();
    fixture.detectChanges();

    const req = httpMock.expectOne(`${baseUrl}/eco-tech/evolucion-huella?rango=historico`);
    expect(req.request.method).toBe('GET');
    req.flush({ ...EVOLUCION_MOCK, rangoPeriodo: 'historico' });
  });

  it('formatea numeros con locale es-CR', () => {
    expect(component['formatNumero'](1234567)).toContain('1');
  });
});
