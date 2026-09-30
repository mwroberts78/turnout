import { z } from 'zod';
import { numericStringToNullable } from './numeric-string';

export const signupEditFormSchema = z.object({
  workCompleted: z.boolean(),
  actualHours: numericStringToNullable(z.number().nonnegative()),
});
