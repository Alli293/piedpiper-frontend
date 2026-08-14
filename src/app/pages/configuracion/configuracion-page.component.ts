import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { disabled, form, FormField, schema, submit } from '@angular/forms/signals';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { SelectInputComponent } from '../../shared/components/inputs/select-input/select-input.component';
import { ToastService } from '../../shared/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { PreferenciasService } from '../../core/services/preferencias.service';
import {
  Idioma,
  Moneda,
  Unidades,
  OPCIONES_IDIOMA,
  OPCIONES_MONEDA,
  OPCIONES_UNIDADES,
  Preferencias,
  PREFERENCIAS_POR_DEFECTO,
} from '../../core/models/preferencias.model';

interface PreferenciasFormModel {
  idioma: Idioma;
  moneda: Moneda;
  unidades: Unidades;
}

@Component({
  selector: 'app-configuracion-page',
  imports: [
    FormField,
    ShellLayoutComponent,
    CardComponent,
    ButtonComponent,
    HeadingComponent,
    SelectInputComponent,
  ],
  templateUrl: './configuracion-page.component.html',
  styleUrl: './configuracion-page.component.scss',
})
export class ConfiguracionPageComponent implements OnInit {
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly toastService = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly opcionesIdioma = OPCIONES_IDIOMA;
  protected readonly opcionesMoneda = OPCIONES_MONEDA;
  protected readonly opcionesUnidades = OPCIONES_UNIDADES;

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);

  protected readonly model = signal<PreferenciasFormModel>({ ...PREFERENCIAS_POR_DEFECTO });

  protected readonly preferenciasForm = form(
    this.model,
    schema<PreferenciasFormModel>((path) => {
      disabled(path.idioma, { when: () => this.guardando() });
      disabled(path.moneda, { when: () => this.guardando() });
      disabled(path.unidades, { when: () => this.guardando() });
    })
  );

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: this.i18n.t('config.seccion').toUpperCase(),
    pageTitle: this.i18n.t('config.titulo'),
  }));

  ngOnInit(): void {
    this.preferenciasService.cargar().subscribe({
      next: (preferencias) => {
        this.aplicarSeleccion(preferencias);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    await submit(this.preferenciasForm, {
      action: async (field) => {
        const value = field().value();
        this.guardando.set(true);
        try {
          const guardadas = await firstValueFrom(this.preferenciasService.actualizar(value));
          this.aplicarSeleccion(guardadas);
          this.guardando.set(false);
          this.toastService.success(this.i18n.t('config.guardarExito'));
        } catch (err: unknown) {
          this.aplicarSeleccion(this.preferenciasService.preferencias());
          this.guardando.set(false);
          this.toastService.error(this.i18n.t('config.errorGuardar'));
        }
        return undefined;
      },
    });
  }

  private aplicarSeleccion(preferencias: Preferencias): void {
    this.model.set({
      idioma: preferencias.idioma,
      moneda: preferencias.moneda,
      unidades: preferencias.unidades,
    });
  }
}
