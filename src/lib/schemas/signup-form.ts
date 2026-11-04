import { z } from 'zod';
import { tshirtSizesEnum } from '@/db/schema';

export function buildSignupFormSchema(opportunity: {
  mealProvided: boolean;
  tshirtProvided: boolean;
  mealOptionIds: string[];
}) {
  const requiresMealChoice =
    opportunity.mealProvided && opportunity.mealOptionIds.length > 0;

  return z
    .object({
      estimatedHours: z
        .string()
        .trim()
        .min(1, { message: 'Estimated hours is required' })
        .transform(Number)
        .pipe(
          z
            .number({ message: 'Hours must be a number' })
            .positive({ message: 'Hours must be more than 0' })
            .max(24, { message: 'Hours must be 24 or less' }),
        ),
      wantsMeal: z.boolean(),
      selectedMeal: z.string().nullable(),
      wantsTShirt: z.boolean(),
      tshirtSize: z.enum(tshirtSizesEnum.enumValues).nullable(),
      comments: z
        .string()
        .trim()
        .max(500, { message: 'Comments must be 500 characters or less' })
        .nullable()
        .transform((value) => (value === '' ? null : value)),
    })
    .refine(
      (data) =>
        !(requiresMealChoice && data.wantsMeal) ||
        (data.selectedMeal !== null &&
          opportunity.mealOptionIds.includes(data.selectedMeal)),
      { message: 'Select a meal', path: ['selectedMeal'] },
    )
    .refine(
      (data) =>
        !(opportunity.tshirtProvided && data.wantsTShirt) ||
        data.tshirtSize !== null,
      { message: 'Select a t-shirt size', path: ['tshirtSize'] },
    )
    .transform((data) => {
      const wantsMeal = opportunity.mealProvided && data.wantsMeal;
      const wantsTShirt = opportunity.tshirtProvided && data.wantsTShirt;

      return {
        ...data,
        wantsMeal,
        selectedMeal:
          wantsMeal && requiresMealChoice ? data.selectedMeal : null,
        wantsTShirt,
        tshirtSize: wantsTShirt ? data.tshirtSize : null,
      };
    });
}

export type SignupFormSchema = ReturnType<typeof buildSignupFormSchema>;
export type SignupFormOutput = z.output<SignupFormSchema>;
