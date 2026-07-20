# CarbonHub Frontend Standards

These are the conventions for this codebase. Each rule is justified by either an **established Angular best practice** or an **existing repo convention** (the pattern already used across `src/app`, which we keep for consistency). They exist so every contribution looks like it was written by one person.

Each rule points at a real reference file in this repo to copy from. For quick day-to-day use, see [`CLAUDE.md`](../CLAUDE.md) (generation guardrail) and [`PR_AUDIT_CHECKLIST.md`](PR_AUDIT_CHECKLIST.md) (review gate).

---

## 1. Forms & validation — Signal Forms only

**Why:** repo convention — every form in `src/app` uses `@angular/forms/signals`; mixing form paradigms fragments the codebase and doubles the patterns contributors must learn. Best practice on Angular 22: one typed model signal is the single source of truth, with less boilerplate than Reactive Forms and no manual subscription lifecycle to manage.

Reactive Forms (`FormGroup` / `FormControl` / `ReactiveFormsModule`) and per-field signals are not used. One typed model signal drives the form; a `schema` declares validation, required-ness, and disabling.

```ts
// Avoid — Reactive Forms + custom ValidatorFn + valueChanges subscription
form = new FormGroup({
  anio: new FormControl(null, { nonNullable: true, validators: [anioValidoValidator] }),
});
this.form.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe(/* ... */);

// Use — see pages/limites/limites-page.component.ts
interface LimitesFormModel { anio: number | null; limiteMt: number | null; }
protected readonly model = signal<LimitesFormModel>({ anio: null, limiteMt: null });
protected readonly form = form(
  this.model,
  schema<LimitesFormModel>((path) => {
    validate(path.anio, /* ... */);
    maxLength(path.limiteMt, /* ... */);
    disabled(path.anio, { when: () => this.guardando() });
  }),
);
// react to field changes with effect(), not valueChanges:
effect(() => { if (this.form.anio().valid()) this.precargarLimite(); });
```

**Standard submit shape** (see `pages/auth/registro/registro-rol-page.component.ts`):

```ts
protected handleSubmit(event: Event): void {
  event.preventDefault();
  void this.onSubmit();
}

private async onSubmit(): Promise<void> {
  await submit(this.registroForm, {
    action: async (field) => {
      const value = field().value();
      await firstValueFrom(/* api call */);
      return undefined;
    },
    onInvalid: (field) => field().markAsTouched(),
  });
}
```

`submit()` also accepts a bare action callback (`submit(form, async (field) => { ... })`, see `pages/empresa/configuracion-inicial-page.component.ts`); prefer the object form with `onInvalid` when you need to mark fields touched. Use `firstValueFrom` for the API call, never a manual `.subscribe()` — it avoids leaked subscriptions and reads as a linear async flow.

Other rules:

- The `<form>` element carries **`novalidate`** so consistent component-level errors show instead of inconsistent native browser tooltips.
- Disable fields **declaratively** with `disabled(path.x, { when: () => this.cargando() })` — not per-input `[disabled]`. Keeps disable logic co-located with the schema.
- Centralize validation regex/messages in `shared/utils` — `email.utils.ts` (`EMAIL_PATTERN`, `EMAIL_MENSAJE`), `password.utils.ts` (`CONTRASENA_PATTERN`, `CONTRASENA_MENSAJE`, `CONTRASENA_HINT`). DRY: one definition keeps validation identical across every form.
- Field error text comes from `fieldError(field)` in `shared/utils/form-field.utils.ts`. **Do not** paste a private copy into a component — `limites` and `configuracion-inicial-perfil` already use the shared util, follow that pattern.

## 2. Components & dependency injection

- **Standalone components only.** No `NgModule`. Repo convention and the Angular-recommended default since v17.
- Inject with **`inject()` into `private readonly` fields**; constructors are for init logic only, not parameter injection. Best practice: works with inheritance, avoids long constructor signatures, and is the modern Angular idiom.
- Inputs via `input()` / `input.required<T>()`; two-way via `model()`; derived values via `computed()`; view refs via `viewChild.required()`. **Never `@Input()` / `@Output()`** — the signal-based APIs integrate with the reactivity graph and are the repo standard.
- Prefer the shared presentational primitives over hand-rolled markup (DRY, consistent look, one place to fix bugs):
  - headings → `app-heading` (`shared/components/heading`)
  - wordmark → `app-logo` (`shared/components/logo`)
  - badges → `app-badge` with optional `icon` (`shared/components/badge`)
  - password fields → `app-password-input` (`shared/components/inputs/password-input`)
- **One component/service per concept.** Duplicates (e.g. two toast services, near-identical stat cards, per-role copies of the same form) drift apart over time — search `shared/` before adding anything, and consolidate rather than fork.
- No inline `template:` / `styles:` for non-trivial components — use external `.html` / `.scss`. Keeps files focused and diffs readable.

## 3. Templates

- Built-in control flow only: `@if` / `@else` / `@for` / `@switch` / `@case`. **No `*ngIf` / `*ngFor`.** Best practice on Angular 17+: built-in flow needs no module import, narrows types better, and is faster.
- Every `@for` has `track` — a stable id where possible (`track emision.id`), else `track $index`. Required for correct/efficient DOM reuse.
- Import granular symbols (`DatePipe`, `FormField`) instead of `CommonModule`. Smaller surface, clearer dependencies (e.g. `limites-page.component.ts` imports `DatePipe`, not `CommonModule`).
- Inline anchors use the `appLink` directive (`a[appLink]`, class `ch-link`). Encode `<` / `>` in copy as `&lt;` / `&gt;`.

## 4. TypeScript

- A dedicated typed interface per form model: `LoginFormModel`, `RegistroFormModel`, `LimitesFormModel`, `PerfilInicialFormModel`. Makes the form's shape explicit and self-documenting.
- Domain models are `export interface`, PascalCase, one concept per file.
- Errors: `catch (err: unknown)` then narrow — `err instanceof HttpErrorResponse`, or `(err as { status?: number })?.status`. No implicit `any` — `unknown` forces a deliberate check before use.
- Use union / `Record<K, V>` types for component variants (`HeadingLevel`, `LogoVariant`, `BadgeVariant`) so invalid values fail at compile time.
- Keep frontend models in sync with backend DTOs (e.g. `recienCreada: boolean` on `LimiteEmisionesResponse`).
- HTTP methods on services return typed `Observable<T>`.

> Note: `tsconfig.json` sets several strict flags (`noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`) but **not** the umbrella `strict: true`. Write code as if strict-null-checks were on regardless — it's the safer default.

## 5. Error handling & user feedback

- Surface the API's message: `err?.error?.message ?? '<fallback en español>'`. Distinguish HTTP statuses — a 409 sets a field-specific message ("Ya existe una cuenta…"), others a general error. Users get actionable feedback instead of a generic failure.
- Separate a `serverError` signal from field validation, and derive the displayed error via `computed()` (server error first, then touched/invalid fields). See `login-page.component.ts`.
- Differentiate created vs updated: `const accion = response.recienCreada ? 'creado' : 'actualizado';`.
- All feedback goes through the shared `ToastService` (`shared/services/toast.service.ts`) with semantic `success()` / `error()`. One notification channel, consistent UX.

## 6. Routing & auth

- Routes are lazy: `loadComponent: () => import(...)`. Best practice — keeps the initial bundle small.
- Authenticated feature routes declare `canActivate: [authGuard]` (`core/auth/auth.guard.ts`). Any route behind login must be guarded — e.g. `/limites`, `/emisiones/registrar`.

## 7. Accessibility

- `role="alert"` on error paragraphs so assistive tech announces them.
- Dynamic labels: `[attr.aria-label]="mostrar() ? 'Ocultar contraseña' : 'Mostrar contraseña'"`.
- Decorative images are hidden from AT: `[attr.aria-hidden]="iconAlt() ? null : 'true'"`; only supply `alt` when meaningful.

## 8. Styling

- BEM-style class names, `ch-` prefix, `var(--ch-*)` tokens (`shared/styles/_tokens.scss`). Repo convention — tokens keep theming centralized and the prefix avoids global collisions.
- Responsive via shared SCSS mixins: `@use '../../styles/mixins'; @include mixins.desktop-up { ... }`.
- Keep `::ng-deep` narrowly scoped to a wrapper class — it's global, so limit its blast radius.

## 9. Testing (Vitest)

- Drive the DOM rather than component internals: dispatch `input` / `change` events via helpers (`setInputValue`, `setChecked`, `fillValidForm`, `submitForm`), and use a fixture factory when a component varies by input (`createFixture(rol)`). Tests survive refactors because they assert behavior, not implementation.
- Async Signal Forms need `await fixture.whenStable()` after dispatching submit; make such specs `async`.
- When you must touch state, update the model signal (`comp.model.update((m) => ({ ...m, email: '…' }))`).
- Cover error branches with `throwError` (e.g. 409).

## 10. Naming, structure & tooling

- **Repo naming convention:** `*.component.ts` / `*.service.ts` file suffixes, `XPageComponent` class names, kebab-case files, PascalCase classes, `app-` selector prefix. Consistency within the repo matters more than any single alternative style — match what's already here.
- Layout: `core/` (singletons, guards, interceptors, models) · `shared/` (components, services, utils, styles) · `pages/` (routed features). Every component keeps a co-located `.spec.ts`.
- Prettier: single quotes, `printWidth: 100`, `trailingComma: es5`, `semi: true`, 2-space indent, final newline. There is **no ESLint** — Prettier + the TypeScript/Angular compiler are the only automated gates, alongside Vitest.
- **Do not modify shared config** (`.prettierrc`, `.gitignore`, `tsconfig*.json`, `package.json`, `.claude/*`) inside a feature PR without isolating and justifying it in the PR **Notas** section. Config changes affect everyone and cause silent conflicts across branches.
