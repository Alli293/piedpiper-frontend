import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { ImaService, ImaResponse } from '../dashboard/ima.service';
import { ImaPanelComponent } from '../dashboard/ima-panel.component';

@Component({
  selector: 'app-benchmark-page',
  standalone: true,
  imports: [RouterLink, ShellLayoutComponent, HeadingComponent, ImaPanelComponent],
  templateUrl: './benchmark-page.component.html',
  styleUrl: './benchmark-page.component.scss',
})
export class BenchmarkPageComponent implements OnInit {
  private readonly imaService = inject(ImaService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly anioSeleccionado = signal(new Date().getFullYear());
  protected readonly mesSeleccionado = signal(new Date().getMonth() + 1);
  protected readonly imaData = signal<ImaResponse | null>(null);
  protected readonly cargandoIma = signal(true);
  protected readonly errorIma = signal(false);

  private requestId = 0;

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'MADUREZ AMBIENTAL',
    pageTitle: 'Índice de Madurez Ambiental (IMA)',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  ngOnInit(): void {
    void this.cargarIma(this.anioSeleccionado(), this.mesSeleccionado());
  }

  protected onImaPeriodoChange(evento: { anio: number; mes: number }): void {
    this.mesSeleccionado.set(evento.mes);
    void this.cargarIma(evento.anio, evento.mes);
  }

  private async cargarIma(anio: number, mes: number): Promise<void> {
    const currentRequest = ++this.requestId;
    this.cargandoIma.set(true);
    this.errorIma.set(false);
    try {
      const ima = await firstValueFrom(this.imaService.obtenerIma(anio, mes));
      if (currentRequest === this.requestId) {
        this.imaData.set(ima);
      }
    } catch (err: unknown) {
      if (currentRequest === this.requestId) {
        this.imaData.set(null);
        this.toastService.error(
          apiErrorMessage(err) ?? 'No se pudo calcular tu IMA. Intente nuevamente.',
          undefined,
          5000
        );
        this.errorIma.set(true);
      }
    } finally {
      if (currentRequest === this.requestId) {
        this.cargandoIma.set(false);
      }
    }
  }
}
