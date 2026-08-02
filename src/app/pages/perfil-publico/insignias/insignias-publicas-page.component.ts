import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { InsigniasEmpresaListComponent } from '../../../shared/components/insignias-empresa/insignias-empresa-list.component';
import { StateHeaderComponent } from '../../../shared/components/state-header/state-header.component';
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { InsigniaEmpresa } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';

const MENSAJE_NO_ENCONTRADO = 'El perfil que buscas no existe o ya no está disponible.';
const MENSAJE_ERROR = 'No fue posible cargar las insignias en este momento.';

@Component({
  selector: 'app-insignias-publicas-page',
  imports: [
    ButtonComponent,
    HeadingComponent,
    IconComponent,
    InsigniasEmpresaListComponent,
    StateHeaderComponent,
    StateLayoutComponent,
  ],
  templateUrl: './insignias-publicas-page.component.html',
  styleUrl: './insignias-publicas-page.component.scss',
})
export class InsigniasPublicasPageComponent implements OnInit {
  private readonly perfilPublicoService = inject(PerfilPublicoService);
  private readonly location = inject(Location);

  readonly slug = input.required<string>();

  protected readonly insignias = signal<InsigniaEmpresa[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly noEncontrado = signal(false);
  protected readonly errorMensaje = signal(MENSAJE_ERROR);
  protected readonly noEncontradoMensaje = MENSAJE_NO_ENCONTRADO;

  private cargaRequestId = 0;

  ngOnInit(): void {
    void this.cargarInsignias();
  }

  protected reintentar(): void {
    void this.cargarInsignias();
  }

  protected volver(): void {
    this.location.back();
  }

  private async cargarInsignias(): Promise<void> {
    const requestId = ++this.cargaRequestId;
    this.cargando.set(true);
    this.error.set(false);
    this.noEncontrado.set(false);
    try {
      const insignias = await firstValueFrom(
        this.perfilPublicoService.listarInsignias(this.slug())
      );
      if (requestId !== this.cargaRequestId) return;
      this.insignias.set(insignias);
    } catch (err: unknown) {
      if (requestId !== this.cargaRequestId) return;
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.noEncontrado.set(true);
      } else {
        this.errorMensaje.set(apiErrorMessage(err) ?? MENSAJE_ERROR);
        this.error.set(true);
      }
    } finally {
      if (requestId === this.cargaRequestId) {
        this.cargando.set(false);
      }
    }
  }
}
