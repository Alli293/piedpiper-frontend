import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AvatarComponent, AvatarShape, AvatarSize } from './avatar.component';

@Component({
  imports: [AvatarComponent],
  template: `
    <app-avatar [initials]="initials" [imageUrl]="imageUrl" [size]="size" [shape]="shape" />
  `,
})
class HostComponent {
  initials = 'CV';
  imageUrl = '';
  size: AvatarSize = 'md';
  shape: AvatarShape = 'round';
}

describe('AvatarComponent', () => {
  function createFixture(overrides: Partial<HostComponent> = {}) {
    const fixture = TestBed.configureTestingModule({
      imports: [HostComponent],
    }).createComponent(HostComponent);
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra las iniciales cuando no hay imageUrl()', () => {
    const fixture = createFixture({ initials: 'CV' });

    const iniciales = fixture.nativeElement.querySelector('.ch-avatar__initials');
    expect(iniciales?.textContent).toBe('CV');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('muestra la imagen cuando imageUrl() no está vacío', () => {
    const fixture = createFixture({ imageUrl: '/images/perfil.jpg' });

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('/images/perfil.jpg');
    expect(fixture.nativeElement.querySelector('.ch-avatar__initials')).toBeNull();
  });

  it('aplica las clases de tamaño y forma por defecto', () => {
    const fixture = createFixture();

    const host: HTMLElement = fixture.nativeElement.querySelector('app-avatar');
    expect(host.classList.contains('ch-avatar--md')).toBe(true);
    expect(host.classList.contains('ch-avatar--round')).toBe(true);
  });

  it('refleja size() y shape() en las clases del host', () => {
    const fixture = createFixture({ size: 'lg', shape: 'square' });

    const host: HTMLElement = fixture.nativeElement.querySelector('app-avatar');
    expect(host.classList.contains('ch-avatar--lg')).toBe(true);
    expect(host.classList.contains('ch-avatar--square')).toBe(true);
  });
});
