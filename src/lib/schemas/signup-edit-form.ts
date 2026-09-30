import { z } from 'zod';

export const signupEditFormSchema = z.object({
  workCompleted: z.boolean(),
  actualHours: z
    .string()
    .transform((val) => (val.trim() === '' ? null : Number(val)))
    .pipe(z.number().nonnegative().nullable()),
});
