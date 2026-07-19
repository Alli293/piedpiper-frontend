# CarbonHub Frontend — Working Agreement (read before generating code)

This file is instructions for any AI assistant or human writing code in this repo. These rules exist to keep the codebase consistent and prevent duplication and config drift. **When in doubt, match the existing code in `src/app` — do not invent new patterns.**

Full rationale and examples: [`docs/FRONTEND_STANDARDS.md`](docs/FRONTEND_STANDARDS.md). Run every change against [`docs/PR_AUDIT_CHECKLIST.md`](docs/PR_AUDIT_CHECKLIST.md) before opening a PR.

## Project shape

- **Angular 22, standalone components only** (no `NgModule`), **signals-first**.
- **Forms:** Angular **Signal Forms** (`@angular/forms/signals`). Reactive Forms are not used here.
- **Tests:** **Vitest** (`ng test`) — no Karma/Jasmine.
- **Formatting:** **Prettier only, there is no ESLint.** Single quotes, width 100, `trailingComma: es5`, 2-space indent, final newline.
- **Language:** code identifiers, domain terms, and user-facing strings are **Spanish** (`cargando`, `serverError`, `cerrarSesion`). Documentation is English.
- **Layout:** `src/app/core/` (singletons, guards, interceptors, models), `src/app/shared/` (reusable components/services/utils/styles), `src/app/pages/` (routed features). Styling uses the `ch-` class prefix and `var(--ch-*)` design tokens from `shared/styles/_tokens.scss`.

## Reuse first — search `shared/` before creating anything

These already exist. Use them; do not hand-roll or duplicate them.

- Headings → `app-heading` (`shared/components/heading`). Never style raw `<h1>`/`<h2>`.
- Wordmark/logo → `app-logo` (`shared/components/logo`).
- Badges → `app-badge` (`shared/components/badge`), supports an optional `icon`.
- Password fields → `app-password-input` (`shared/components/inputs/password-input`) — en construcción en la rama `fix/PP-166-auditoria-sprint1`.
- Other inputs → `shared/components/inputs/*` (text, textarea, checkbox, radio, date, number, select).
- Toasts / user feedback → the single `ToastService` in `shared/services/toast.service.ts` (`success()` / `error()`). Do not create another toast service.
- Validation regex + messages → `shared/utils/email.utils.ts`, `shared/utils/password.utils.ts` — en construcción en la rama `fix/PP-166-auditoria-sprint1`.
- Field error text → `fieldError()` in `shared/utils/form-field.utils.ts` — en construcción en la rama `fix/PP-166-auditoria-sprint1`. Do not re-declare it inline.
- Inline anchors → the `appLink` directive (`a[appLink]`).

## Always

- Inject with `inject()` into `private readonly` fields. No constructor-parameter DI.
- Component inputs via `input()` / `input.required()`; two-way via `model()`; derived state via `computed()`.
- Templates use built-in control flow `@if` / `@else` / `@for` / `@switch`; every `@for` has `track`.
- Import only the symbols you use (`DatePipe`, `FormField`, …).
- Type everything: a dedicated `interface XFormModel` per form, `export interface` PascalCase models, typed `Observable<T>` on HTTP methods.
- `catch (err: unknown)` then narrow (`err instanceof HttpErrorResponse`); surface the API message (`err?.error?.message ?? '<fallback en español>'`) and distinguish 403 / 404 / 409.
- Protect authenticated routes with `canActivate: [authGuard]` and load pages lazily with `loadComponent`.
- Accessibility: `role="alert"` on error text, dynamic `[attr.aria-label]`, decorative images get `aria-hidden`.
- Put non-trivial templates/styles in external `.html` / `.scss` files.

## Never

- No `ReactiveFormsModule`, `FormGroup`, `FormControl`, per-field signals, or `valueChanges` subscriptions — use Signal Forms + `effect()`.
- No `@Input()` / `@Output()` decorators.
- No `*ngIf` / `*ngFor` / `CommonModule`.
- No duplicate components/services/utils when a `shared/` one exists.
- No editing shared config — `.prettierrc`, `.gitignore`, `tsconfig*.json`, `package.json`, `.claude/*` — inside a feature PR. If a change is truly required, isolate it and justify it in the PR **Notas** section.
- No services with `@Service()` — use `@Injectable({ providedIn: 'root' })`. For async data prefer Signal Forms / `firstValueFrom` + `try/catch` over fire-and-forget `.subscribe()`.

## Forms — the standard shape

```ts
interface XFormModel { /* one field per control */ }

protected readonly model = signal<XFormModel>({ /* defaults */ });
protected readonly xForm = form(
  this.model,
  schema<XFormModel>((path) => {
    required(path.campo, { message: '...' });
    disabled(path.campo, { when: () => this.cargando() });
  }),
);

protected handleSubmit(event: Event): void {
  event.preventDefault();
  void this.onSubmit();
}

private async onSubmit(): Promise<void> {
  await submit(this.xForm, {
    action: async (field) => {
      const value = field().value();
      // firstValueFrom(...) + try/catch, surface API error message
      return undefined;
    },
    onInvalid: (field) => field().markAsTouched(),
  });
}
```

The template form carries `novalidate`. Reference implementations: `pages/auth/registro/registro-rol-page.component.ts`, `pages/limites/limites-page.component.ts`.

## Before opening a PR

1. `npm run format:check` (CI fails otherwise) — use `npm run format` to fix.
2. `npm test -- --watch=false` — must pass.
3. Walk [`docs/PR_AUDIT_CHECKLIST.md`](docs/PR_AUDIT_CHECKLIST.md); paste the self-audit prompt at the top of it to your assistant to catch violations by `file:line`.
