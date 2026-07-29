import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfiguracionInicialLayoutComponent } from './configuracion-inicial-layout.component';
import { IconName } from '../../components/icon/icon-registry';

@Component({
  imports: [ConfiguracionInicialLayoutComponent],
  template: `
    <app-configuracion-inicial-layout [rolLabel]="rolLabel" [rolIcon]="rolIcon">
      <p>Formulario del perfil</p>
    </app-configuracion-inicial-layout>
  `,
})
class HostComponent {
  rolLabel = 'Empresa';
  rolIcon: IconName = 'empresa';
}

describe('ConfiguracionInicialLayoutComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el badge con la etiqueta y el ícono del rol', () => {
    const fixture = createFixture({ rolLabel: 'Empresa' });
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('app-badge');
    expect(badge?.textContent?.trim()).toBe('Empresa');
    expect(root.querySelector('app-icon')).toBeTruthy();
  });

  it('proyecta el contenido dentro de la tarjeta', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ch-config-inicial-layout__card')?.textContent).toContain(
      'Formulario del perfil'
    );
  });
});
