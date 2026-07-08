import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

type RolIcono = 'empresa' | 'auditor' | 'viajero';

interface OpcionRol {
  id: RolIcono;
  titulo: string;
  descripcion: string;
  ruta: string;
}

@Component({
  selector: 'app-bienvenida-page',
  imports: [AuthLayoutComponent, ButtonComponent, RouterLink],
  templateUrl: './bienvenida-page.component.html',
  styleUrl: './bienvenida-page.component.scss',
})
export class BienvenidaPageComponent {
  protected readonly roles: OpcionRol[] = [
    {
      id: 'empresa',
      titulo: 'Empresa',
      descripcion: 'Registra emisiones, solicita auditorías y obtén certificación digital.',
      ruta: '/registro/empresa',
    },
    {
      id: 'auditor',
      titulo: 'Auditor certificado',
      descripcion: 'Ofrece servicios de auditoría ambiental a empresas en Costa Rica.',
      ruta: '/registro/auditor',
    },
    {
      id: 'viajero',
      titulo: 'Viajero sostenible',
      descripcion: 'Planifica itinerarios de bajo impacto y gana insignias EcoRuta.',
      ruta: '/registro/viajero',
    },
  ];
}
