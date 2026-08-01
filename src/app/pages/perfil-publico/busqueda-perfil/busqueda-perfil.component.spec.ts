import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { environment } from '../../../../environments/environment';
import { BusquedaPerfilComponent } from './busqueda-perfil.component';
import { PerfilPublicoService } from '../perfil-publico.service';
import { BusquedaPerfilPublicoDTO, PageResponse } from '../perfil-publico.models';

describe('BusquedaPerfilComponent', () => {
  let fixture: ComponentFixture<BusquedaPerfilComponent>;
  let component: BusquedaPerfilComponent;
  let httpMock: HttpTestingController;
  let router: Router;
  const baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  const mockResultados: BusquedaPerfilPublicoDTO[] = [
    { nombreEmpresa: 'EcoTech Solutions', slug: 'ecotech-solutions', sectorIndustrial: 'Tecnología', nivelEcologico: 'Oro' },
    { nombreEmpresa: 'EcoVerde SA', slug: 'ecoverde-sa', sectorIndustrial: 'Agricultura', nivelEcologico: 'Plata' },
  ];

  const mockPageResponse: PageResponse<BusquedaPerfilPublicoDTO> = {
    content: mockResultados,
    totalElements: 2,
    totalPages: 1,
    number: 0,
    size: 10,
  };

  const emptyPageResponse: PageResponse<BusquedaPerfilPublicoDTO> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [BusquedaPerfilComponent],
      providers: [
        PerfilPublicoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BusquedaPerfilComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  describe('PerfilPublicoService.buscarEmpresas', () => {
    it('hace GET a /api/perfil-publico/buscar con parámetros correctos', () => {
      const service = TestBed.inject(PerfilPublicoService);
      let resultado: PageResponse<BusquedaPerfilPublicoDTO> | undefined;

      service.buscarEmpresas('eco', 0, 10).subscribe((val) => (resultado = val));

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/buscar` && r.params.get('nombre') === 'eco'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(mockPageResponse);

      expect(resultado).toEqual(mockPageResponse);
    });
  });

  describe('Debounce de 300ms', () => {
    it('no realiza petición HTTP inmediatamente al escribir', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'eco');
      vi.advanceTimersByTime(100);

      httpMock.expectNone((r) => r.url === `${baseUrl}/buscar`);
    });

    it('realiza petición HTTP después de 300ms de debounce', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'eco');
      vi.advanceTimersByTime(300);

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/buscar` && r.params.get('nombre') === 'eco'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });
  });

  describe('Mínimo 3 caracteres', () => {
    it('no realiza petición HTTP cuando el input tiene menos de 3 caracteres', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'ab');
      vi.advanceTimersByTime(300);

      httpMock.expectNone((r) => r.url === `${baseUrl}/buscar`);
    });

    it('realiza petición HTTP cuando el input tiene exactamente 3 caracteres', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'eco');
      vi.advanceTimersByTime(300);

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/buscar` && r.params.get('nombre') === 'eco'
      );
      req.flush(mockPageResponse);
    });
  });

  describe('Resultados con highlight', () => {
    it('muestra resultados y resalta el texto coincidente con <mark>', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'Eco');
      vi.advanceTimersByTime(300);

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/buscar`);
      req.flush(mockPageResponse);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.busqueda-perfil__item');
      expect(items.length).toBe(2);

      const firstNombre = items[0].querySelector('.busqueda-perfil__nombre') as HTMLElement;
      expect(firstNombre.innerHTML).toContain('<mark>');
      expect(firstNombre.textContent).toContain('Eco');
    });
  });

  describe('Navegación al seleccionar resultado', () => {
    it('navega a /empresa/{slug}/reputacion al hacer clic en un resultado', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'eco');
      vi.advanceTimersByTime(300);

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/buscar`);
      req.flush(mockPageResponse);
      fixture.detectChanges();

      const firstItem = fixture.nativeElement.querySelector('.busqueda-perfil__item') as HTMLElement;
      firstItem.click();

      expect(navigateSpy).toHaveBeenCalledWith(['/empresa', 'ecotech-solutions', 'reputacion']);
    });
  });

  describe('Estado vacío', () => {
    it('muestra "No se encontraron empresas." cuando no hay resultados', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'xyz');
      vi.advanceTimersByTime(300);

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/buscar`);
      req.flush(emptyPageResponse);
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.querySelector('.busqueda-perfil__empty') as HTMLElement;
      expect(emptyMsg).not.toBeNull();
      expect(emptyMsg.textContent).toContain('No se encontraron empresas.');
    });

    it('no muestra mensaje vacío cuando hay resultados', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, 'eco');
      vi.advanceTimersByTime(300);

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/buscar`);
      req.flush(mockPageResponse);
      fixture.detectChanges();

      const emptyMsg = fixture.nativeElement.querySelector('.busqueda-perfil__empty');
      expect(emptyMsg).toBeNull();
    });
  });
});
