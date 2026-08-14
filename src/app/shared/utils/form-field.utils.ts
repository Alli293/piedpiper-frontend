export interface TouchedErrorField {
  touched(): boolean;
  errors(): readonly { message?: string }[];
}

export function fieldError(field: TouchedErrorField): string {
  if (!field.touched()) return '';
  return field.errors()[0]?.message ?? '';
}
