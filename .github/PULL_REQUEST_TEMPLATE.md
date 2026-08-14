## Resumen

<!-- Qué implementa este PR, en 1-2 oraciones. Menciona si toca o no otros módulos. -->

Historias incluidas:

- **PP-XX** Descripción breve de la historia

## Detalles técnicos

<!-- Decisiones de implementación relevantes: librerías nuevas, manejo de errores, transacciones, seguridad, etc. -->

-

## Pruebas

<!-- Cuántas pruebas unitarias, qué cubren, con qué herramientas -->

-

## Notas

<!-- Dependencias nuevas agregadas, variables de entorno nuevas requeridas, cambios de configuración, deuda técnica conocida -->

-

## Cumplimiento de estándares

- [ ] Formularios con **Signal Forms** (sin `ReactiveFormsModule` / `FormGroup` / `FormControl` ni señales por campo).
- [ ] Reutilicé componentes de `shared/` (`app-heading`, `app-logo`, `app-badge`, inputs, `ToastService`) en vez de duplicar markup.
- [ ] Plantillas con `@if`/`@for` (con `track`), imports granulares y **sin `CommonModule`**; DI con `inject()`.
- [ ] Tipado fuerte (interfaces de modelo, `catch (err: unknown)` con narrowing) y rutas protegidas con `authGuard` cuando aplica.
- [ ] `npm run format:check` y `npm test -- --watch=false` pasan en local.
- [ ] **No modifico configuración compartida** (`.prettierrc`, `.gitignore`, `tsconfig*`, `package.json`, `.claude/`) sin justificarlo arriba en **Notas**.
