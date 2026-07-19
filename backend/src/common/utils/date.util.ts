export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

export const now = (): Date => new Date();

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * MS_PER_MINUTE);

export const addHours = (date: Date, hours: number): Date =>
  new Date(date.getTime() + hours * MS_PER_HOUR);

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MS_PER_DAY);

/** Is the given date in the past? */
export const isExpired = (date: Date): boolean => date.getTime() < Date.now();

/** YYYY-MM-DD */
export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
