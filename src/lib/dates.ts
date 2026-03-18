const START_DATE = new Date('2026-06-27');

export function getDayDate(index: number): Date {
  const d = new Date(START_DATE);
  d.setDate(d.getDate() + index);
  return d;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
