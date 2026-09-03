import { z } from 'zod';

export const signupListItem = z.object({
  id: z.string(),
  workCompleted: z.boolean(),
  estimatedHours: z.number(),
  actualHours: z.number().nullable(),
  wantsMeal: z.boolean(),
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
  selectedMealOption: z
    .object({
      mealName: z.string(),
    })
    .nullable(),
});
