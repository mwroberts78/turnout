import { formatInTimeZone } from 'date-fns-tz';

export function toDatetimeLocalValue(date: Date, timeZone: string) {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm");
}
