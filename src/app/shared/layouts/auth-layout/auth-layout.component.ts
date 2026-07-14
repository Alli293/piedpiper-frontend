import { Component } from '@angular/core';

interface AuthStat {
  value: string;
  unit?: string;
  label: string;
}

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  host: {
    class: 'ch-auth-layout',
  },
})
export class AuthLayoutComponent {
  protected readonly stats: AuthStat[] = [
    { value: '150+', label: 'empresas certificadas' },
    { value: '48', label: 'auditores certificados activos' },
    { value: '26,282', unit: 'tCO₂e', label: 'verificadas este año' },
  ];
}
