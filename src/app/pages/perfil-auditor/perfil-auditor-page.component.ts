import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { ToastService } from '../../shared/services/toast.service';
import { PerfilAuditorService } from '../../core/perfil-auditor/perfil-auditor.service';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';

@Component({
  selector: 'app-perfil-auditor-page',
  imports: [ShellLayoutComponent, CardComponent, HeadingComponent],
  templateUrl: './perfil-auditor-page.component.html',
  styleUrl: './perfil-auditor-page.component.scss',
})
export class PerfilAuditorPageComponent implements OnInit {
  private readonly perfilAuditorService = inject(PerfilAuditorService);
  private readonly toastService = inject(ToastService);

  protected readonly cargandoCatalogos = signal(true);
  protected readonly errorCatalogos = signal(false);
  protected readonly especialidades = signal<string[]>([]);
  protected readonly zonasCobertura = signal<string[]>([]);

  protected readonly formularioBloqueado = computed(
    () => this.cargandoCatalogos() || this.errorCatalogos()
  );

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'PERFIL AUDITOR',
    pageTitle: 'Mi Perfil de Auditor',
    showNotificationDot: false,
    userInitials: 'AU',
  }));

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  private cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.errorCatalogos.set(false);

    forkJoin({
      especialidades: this.perfilAuditorService.obtenerEspecialidades(),
      zonas: this.perfilAuditorService.obtenerZonasCobertura(),
    }).subscribe({
      next: ({ especialidades, zonas }) => {
        this.especialidades.set(especialidades);
        this.zonasCobertura.set(zonas);
        this.cargandoCatalogos.set(false);
      },
      error: (err: unknown) => {
        this.cargandoCatalogos.set(false);
        this.errorCatalogos.set(true);
        this.mostrarErrorCatalogo(err);
      },
    });
  }

  private mostrarErrorCatalogo(_err: unknown): void {
    this.toastService.error(
      'No se pudo cargar el catálogo. Intente recargar la página.'
    );
  }
}
