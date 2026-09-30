import { z } from 'zod';
import { tshirtSizesEnum } from '@/db/schema';

export const signupListItem = z.object({
  id: z.string(),
  workCompleted: z.boolean(),
  estimatedHours: z.number(),
  opportunityId: z.string(),
  actualHours: z.number().nullable(),
  wantsMeal: z.boolean(),
  comments: z.string().nullable(),
  wantsTShirt: z.boolean(),
  tshirtSize: z.enum(tshirtSizesEnum.enumValues).nullable(),
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
