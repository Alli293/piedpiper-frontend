-- =============================================================================
-- SEED DATA para demo PP-75: Insignias en el dashboard de Certificaciones
-- Empresa: Café del Valle S.A. (usuario admin@cafedelvalle.test)
-- empresa_id: 99502a42-6ec3-478d-97f1-cda6df088091
-- =============================================================================

-- ============ CATALOGO DE INSIGNIAS ============
-- El catálogo (idInsignia=3 "Excelencia climática empresarial", niveles
-- bronce/plata/oro) normalmente lo siembra CatalogoInsigniasEmpresaBootstrap
-- al arrancar el backend. Este INSERT es idempotente por si el script se
-- corre antes de haber levantado la app al menos una vez.

INSERT INTO catalogo_insignias (id_insignia, nombre, descripcion, nivel_insignia, cantidad_minima_certificaciones_activas, activa)
VALUES
  (3, 'Excelencia climatica empresarial', 'Reconocimiento por mantener una certificacion ambiental activa validada.', 'bronce', 1, true),
  (3, 'Excelencia climatica empresarial', 'Reconocimiento por sostener dos certificaciones ambientales activas y complementarias.', 'plata', 2, true),
  (3, 'Excelencia climatica empresarial', 'Reconocimiento por demostrar una gestion climatica integral con tres certificaciones activas.', 'oro', 3, true)
ON CONFLICT ON CONSTRAINT uk_catalogo_insignias_id_nivel DO NOTHING;

-- ============ INSIGNIAS OBTENIDAS POR LA EMPRESA ============
-- 3 niveles con fechas distintas para ver el orden (más reciente primero) y
-- el bloque "Insignias activas" del dashboard con datos reales.

INSERT INTO insignias_empresa (id, empresa_id, id_insignia, nivel_insignia, fecha_obtencion)
VALUES
  (gen_random_uuid(), '99502a42-6ec3-478d-97f1-cda6df088091', 3, 'bronce', '2026-01-15 09:00:00+00'),
  (gen_random_uuid(), '99502a42-6ec3-478d-97f1-cda6df088091', 3, 'plata',  '2026-03-05 09:00:00+00'),
  (gen_random_uuid(), '99502a42-6ec3-478d-97f1-cda6df088091', 3, 'oro',    '2026-04-12 09:00:00+00')
ON CONFLICT ON CONSTRAINT uk_insignias_empresa_empresa_insignia_nivel
  DO UPDATE SET fecha_obtencion = EXCLUDED.fecha_obtencion;

-- ============ VERIFICACION ============
-- SELECT ie.nivel_insignia, ci.nombre, ie.fecha_obtencion
-- FROM insignias_empresa ie
-- JOIN catalogo_insignias ci ON ci.id_insignia = ie.id_insignia AND ci.nivel_insignia = ie.nivel_insignia
-- WHERE ie.empresa_id = '99502a42-6ec3-478d-97f1-cda6df088091'
-- ORDER BY ie.fecha_obtencion DESC;
