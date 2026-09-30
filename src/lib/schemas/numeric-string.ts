import { z } from 'zod';

export function numericStringToNullable(numberSchema: z.ZodNumber) {
  return z
    .string()
    .transform((val) => (val.trim() === '' ? null : Number(val)))
    .pipe(numberSchema.nullable());
}
