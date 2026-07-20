export function countDecimals(value: number): number {
  const text = value.toString();
  const dotIndex = text.indexOf('.');
  return dotIndex === -1 ? 0 : text.length - dotIndex - 1;
}
