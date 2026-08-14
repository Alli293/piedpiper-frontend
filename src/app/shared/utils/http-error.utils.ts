import { HttpErrorResponse } from '@angular/common/http';

export function isAuthError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
}

export function apiErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof HttpErrorResponse)) return undefined;
  return messageFromApiBody(error.error);
}

export async function apiErrorMessageAsync(error: unknown): Promise<string | undefined> {
  const message = apiErrorMessage(error);
  if (message !== undefined) return message;
  if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) return undefined;

  const text = await error.error.text();
  if (!text) return undefined;

  try {
    return messageFromApiBody(JSON.parse(text));
  } catch {
    return undefined;
  }
}

function messageFromApiBody(body: unknown): string | undefined {
  if (body === null || typeof body !== 'object' || body instanceof Blob) return undefined;
  const message = (body as Record<string, unknown>)['message'];
  return typeof message === 'string' ? message : undefined;
}
