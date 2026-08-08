import { variantePorEstadoAuditoria } from './auditoria-estado.utils';

describe('variantePorEstadoAuditoria', () => {
  it('mapea los estados de auditoria a variantes de badge', () => {
    expect(variantePorEstadoAuditoria('CERTIFICACION_EMITIDA')).toBe('success');
    expect(variantePorEstadoAuditoria('OBSERVACIONES_PENDIENTES')).toBe('warning');
    expect(variantePorEstadoAuditoria('SOLICITUD_ENVIADA')).toBe('neutral');
    expect(variantePorEstadoAuditoria('REPORTE_CARGADO')).toBe('info');
    expect(variantePorEstadoAuditoria(undefined)).toBe('info');
  });
});
