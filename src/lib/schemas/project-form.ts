import { z } from 'zod';

export const projectFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { message: 'Project title must be at least 2 characters' })
    .max(120, { message: 'Project title must be 120 characters or less' }),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description must be 2000 characters or less' })
    .nullable()
    .transform((value) => (value === '' ? null : value)),
});

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormOutput = z.output<typeof projectFormSchema>;
