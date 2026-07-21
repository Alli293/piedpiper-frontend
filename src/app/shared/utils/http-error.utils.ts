import { HttpErrorResponse } from '@angular/common/http';

export function isAuthError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
}

export function apiErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof HttpErrorResponse)) return undefined;
  const apiError = error.error as { message?: string } | null;
  return apiError?.message ?? undefined;
}
