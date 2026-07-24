import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SemanticCardComponent } from './semantic-card.component';

@Component({
  imports: [SemanticCardComponent],
  template: `
    <app-semantic-card variant="success" title="Invitación válida">
      Enviada por <strong>Acme S.A.</strong>
    </app-semantic-card>
  `,
})
class HostConContenidoProyectadoComponent {}

@Component({
  imports: [SemanticCardComponent],
  template: ` <app-semantic-card variant="info" title="Solo texto" text="Un mensaje simple." /> `,
})
class HostSoloTextoComponent {}

@Component({
  imports: [SemanticCardComponent],
  template: ` <app-semantic-card variant="warning" title="Sin texto ni contenido" /> `,
})
class HostSinTextoNiContenidoComponent {}

describe('SemanticCardComponent', () => {
  it('renderiza el texto simple como antes cuando se usa el input text()', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostSoloTextoComponent],
    }).createComponent(HostSoloTextoComponent);
    fixture.detectChanges();

    const texto = fixture.nativeElement.querySelector('.ch-semantic-card__text');
    expect(texto?.textContent?.trim()).toBe('Un mensaje simple.');
  });

  it('renderiza contenido HTML proyectado por ng-content', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostConContenidoProyectadoComponent],
    }).createComponent(HostConContenidoProyectadoComponent);
    fixture.detectChanges();

    const contenido = fixture.nativeElement.querySelector('.ch-semantic-card__content');
    const negrita = fixture.nativeElement.querySelector('.ch-semantic-card__content strong');
    expect(contenido?.textContent).toContain('Enviada por');
    expect(negrita?.textContent).toBe('Acme S.A.');
  });

  it('no agrega ningún <p> vacío cuando no hay text() ni contenido proyectado', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HostSinTextoNiContenidoComponent],
    }).createComponent(HostSinTextoNiContenidoComponent);
    fixture.detectChanges();

    const texto = fixture.nativeElement.querySelector('.ch-semantic-card__text');
    expect(texto).toBeNull();
  });
});
