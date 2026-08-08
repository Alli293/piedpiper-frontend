import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { CompartirPerfilComponent } from './compartir-perfil/compartir-perfil.component';
import { EvolucionHuellaChartComponent } from './evolucion-huella-chart.component';
import { PerfilPublicoPageComponent } from './perfil-publico-page.component';
import { PerfilPublicoService } from './perfil-publico.service';
import { EvolucionHuellaDTO, PerfilPublicoDTO, PuntoHuella } from './perfil-publico.models';

@Component({ selector: 'app-icon', template: '', standalone: true })
class IconStubComponent {
  name = input.required<string>();
  size = input(16);
}

@Component({ selector: 'app-logo', template: '', standalone: true })
class LogoStubComponent {
  variant = input('on-light');
  iconSize = input(24);
  textSize = input('18px');
  gap = input('9px');
}

@Component({ selector: 'app-compartir-perfil', template: '', standalone: true })
class CompartirPerfilStubComponent {
  slug = input.required<string>();
}

@Component({ selector: 'app-evolucion-huella-chart', template: '', standalone: true })
class EvolucionHuellaChartStubComponent {
  serie = input<PuntoHuella[]>([]);
}

const PERFIL_MOCK: PerfilPublicoDTO = {
  nombreEmpresa: 'EcoTech Solutions',
  logoUrl: 'https://example.com/logo.png',
  sectorIndustrial: 'Tecnología',
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
          imports: [
            IconComponent,
            LogoComponent,
            CompartirPerfilComponent,
            EvolucionHuellaChartComponent,
          ],
        },
        add: {
          imports: [
            IconStubComponent,
            LogoStubComponent,
            CompartirPerfilStubComponent,
            EvolucionHuellaChartStubComponent,
          ],
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

  it('renderiza nombre, sector, país y nivel cuando la data carga exitosamente', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-card__nombre')?.textContent).toContain('EcoTech Solutions');
    expect(el.querySelector('.pub-nivel__nombre')?.textContent).toContain('Oro');
  });

  it('renderiza página 404 cuando ocurre un error 404', () => {
    fixture.detectChanges();
    flushError(404, { mensaje: 'El perfil que buscas no existe o ya no está disponible.' });

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
  ])(
    'normalizarNivel convierte $input a $expected y aplica clase $cssClass',
    ({ input, expected, cssClass }) => {
      fixture.detectChanges();
      flushPerfil({ ...PERFIL_MOCK, nivelEcologico: input });

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector(`.${cssClass}`)).not.toBeNull();
      expect(el.querySelector('.pub-nivel__nombre')?.textContent).toContain(expected);
    }
  );

  it('abre el modal de compartir perfil', () => {
    fixture.detectChanges();
    flushPerfil(PERFIL_MOCK);

    const boton = fixture.nativeElement.querySelector(
      '.pub-header__btn-compartir'
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.pub-modal')).not.toBeNull();
    expect(el.querySelector('app-compartir-perfil')).not.toBeNull();
  });

  it('muestra gráfico y tendencia cuando hay varios periodos verificados', () => {
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
      'Esta empresa aún no cuenta con datos de huella de carbono verificados.'
    );
    expect(el.querySelector('app-evolucion-huella-chart')).toBeNull();
  });

  it('muestra error inline cuando falla la evolución sin romper el perfil', () => {
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

  it('formatea números con locale es-CR', () => {
    expect(component['formatNumero'](1234567)).toContain('1');
  });
});
