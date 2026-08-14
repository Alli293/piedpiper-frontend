import { BadgeVariant } from '../../shared/components/badge/badge.component';
import { EstadoSolicitudAuditoria } from './auditoria.model';

export function variantePorEstadoAuditoria(
  estado: EstadoSolicitudAuditoria | null | undefined
): BadgeVariant {
  switch (estado) {
    case 'CERTIFICACION_EMITIDA':
      return 'success';
    case 'OBSERVACIONES_PENDIENTES':
      return 'warning';
    case 'SOLICITUD_ENVIADA':
      return 'neutral';
    default:
      return 'info';
  }
}
