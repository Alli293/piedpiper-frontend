# PR Audit Checklist

Run this against your diff **before requesting review**. It mirrors [`FRONTEND_STANDARDS.md`](FRONTEND_STANDARDS.md); open that file for the reasoning and reference implementations behind any item.

## AI self-audit prompt (paste this to your assistant first)

> Review my current diff against `docs/FRONTEND_STANDARDS.md` and `CLAUDE.md` in this repo. For every violation, list it as `file:line — rule broken — how to fix`. Check specifically: Signal Forms (no Reactive Forms / no per-field signals / no `valueChanges`), reuse of shared components instead of new duplicates, `@if`/`@for` with `track` (no `*ngIf`/`*ngFor`/`CommonModule`), `inject()` DI, `input()`/`model()` (no `@Input`/`@Output`), typed models + `unknown` catches, `authGuard` on new authenticated routes, and no edits to shared config files. Do not fix anything yet — just report.

Then fix what it finds, and confirm the boxes below by hand.

## Forms & validation

- [ ] All forms use Signal Forms — no `ReactiveFormsModule`, `FormGroup`, `FormControl`.
- [ ] One typed `model = signal<XFormModel>()` per form; no per-field signals.
- [ ] No `valueChanges` subscriptions — reactive behavior uses `effect()`.
- [ ] Submit uses `handleSubmit(event){ event.preventDefault(); void onSubmit(); }` → `submit(form, { action, onInvalid: (f) => f().markAsTouched() })`, with `firstValueFrom` for the API call.
- [ ] The `<form>` has `novalidate`; fields disable via `disabled(path, { when })`.
- [ ] Email/password regex + messages come from `shared/utils`; `fieldError()` is imported, not re-declared.

## Components, templates & DI

- [ ] Standalone component; DI via `inject()` into `private readonly` fields (no constructor-param DI).
- [ ] Inputs via `input()`/`input.required()`, two-way via `model()`; no `@Input()`/`@Output()`.
- [ ] Reused `app-heading` / `app-logo` / `app-badge` / `app-password-input` / shared inputs instead of hand-rolled markup.
- [ ] No new component/service/util that duplicates one already in `shared/`.
- [ ] Templates use `@if`/`@for`/`@switch`; every `@for` has `track`. No `*ngIf`/`*ngFor`.
- [ ] Granular imports (`DatePipe`, `FormField`), not `CommonModule`.
- [ ] Non-trivial templates/styles live in external `.html`/`.scss` files.
- [ ] Inline anchors use the `appLink` directive.

## TypeScript & error handling

- [ ] Typed form-model interface + `export interface` PascalCase models, one per file.
- [ ] `catch (err: unknown)` with narrowing (`err instanceof HttpErrorResponse`); no implicit `any`.
- [ ] API error message surfaced (`err?.error?.message ?? fallback`); 403/404/409 distinguished.
- [ ] Feedback goes through the shared `ToastService` (`success()`/`error()`).
- [ ] Frontend models stay in sync with backend DTOs.

## Routing, a11y & styling

- [ ] New authenticated routes declare `canActivate: [authGuard]` and load via `loadComponent`.
- [ ] Error text has `role="alert"`; interactive controls have a meaningful `[attr.aria-label]`; decorative images are `aria-hidden`.
- [ ] Classes use BEM + `ch-` prefix + `var(--ch-*)` tokens; `::ng-deep` is scoped.

## Tests & tooling

- [ ] Specs drive the DOM; async Signal Form specs `await fixture.whenStable()`; error branches covered.
- [ ] `npm test -- --watch=false` passes.
- [ ] `npm run format:check` passes.
- [ ] **No changes to `.prettierrc`, `.gitignore`, `tsconfig*.json`, `package.json`, or `.claude/*`** — unless isolated and justified in the PR **Notas** section (new dependencies must be intentional and pinned).
- [ ] File/class naming matches the repo (`*.component.ts` / `*.service.ts`, `XPageComponent`, `app-` selector).
