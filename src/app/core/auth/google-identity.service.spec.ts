import { TestBed } from '@angular/core/testing';
import { GoogleIdentityService } from './google-identity.service';

describe('GoogleIdentityService', () => {
  let service: GoogleIdentityService;
  let ultimoScript: HTMLScriptElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GoogleIdentityService] });
    service = TestBed.inject(GoogleIdentityService);

    (globalThis as unknown as { google: unknown }).google = {
      accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } },
    };

    document.querySelectorAll('script[src*="gsi/client"]').forEach((script) => script.remove());

    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      ultimoScript = node as HTMLScriptElement;
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as unknown as { google?: unknown }).google;
  });

  function render(): Promise<void> {
    return service.renderizarBoton(document.createElement('div'), () => {});
  }

  it('carga el script una sola vez y reutiliza la promesa en llamadas siguientes', async () => {
    const primera = render();
    ultimoScript.onload!(new Event('load'));
    await primera;

    await render();

    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    expect(
      (globalThis as unknown as { google: { accounts: { id: { renderButton: unknown } } } }).google
        .accounts.id.renderButton
    ).toHaveBeenCalledTimes(2);
  });

  it('reinicia el estado cuando falla la carga para permitir reintentar', async () => {
    const primera = render();
    ultimoScript.onerror!(new Event('error'));
    await expect(primera).rejects.toThrow('No se pudo cargar Google Identity Services.');
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);

    const reintento = render();
    ultimoScript.onload!(new Event('load'));
    await reintento;

    expect(document.head.appendChild).toHaveBeenCalledTimes(2);
  });
});
