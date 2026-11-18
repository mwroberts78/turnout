import { z } from 'zod';

export function numericStringToNullable(numberSchema: z.ZodNumber) {
  return z
    .string()
    .transform((val) => (val.trim() === '' ? null : Number(val)))
    .pipe(numberSchema.nullable());
}

export function requiredHoursString(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, { message: requiredMessage })
    .transform(Number)
    .pipe(
      z
        .number({ message: 'Hours must be a number' })
        .positive({ message: 'Hours must be more than 0' })
        .max(24, { message: 'Hours must be 24 or less' }),
    );
}
