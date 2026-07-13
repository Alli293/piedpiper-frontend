export function toIsoDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toSpanishMonthName(date: Date): string {
  return new Intl.DateTimeFormat('es', { month: 'long', timeZone: 'UTC' }).format(date);
}
