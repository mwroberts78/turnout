import { fromZonedTime } from 'date-fns-tz';
import { z } from 'zod';
import { opportunityTypeEnum } from '@/db/schema';

export function needsTimeZone(data: {
  opportunityType: string;
  hasPhysicalLocation: boolean;
}) {
  return (
    data.opportunityType === 'in-person' ||
    (data.opportunityType === 'skills-based' && data.hasPhysicalLocation)
  );
}

export function buildOpportunityFormSchema(
  minCapacity: number,
  fallbackTimeZone: string,
) {
  return z
    .object({
      title: z
        .string()
        .min(2, { message: 'Opportunity title must be at least 2 characters' }),
      description: z.string().nullable(),
      opportunityType: z.enum(
        opportunityTypeEnum.enumValues,
        'Please select an opportunity type',
      ),
      location: z.string().nullable(),
      imageUrl: z.string().nullable(),
      startTime: z.string().min(1, { message: 'Start time is required' }),
      endTime: z.string().min(1, { message: 'End time is required' }),
      timeZone: z.string().nullable(),
      hasPhysicalLocation: z.boolean(),
      mealProvided: z.boolean(),
      mealOptions: z.array(
        z.object({
          mealOptionId: z.string().optional(),
          mealName: z.string().min(1, 'Meal name is required'),
        }),
      ),
      tshirtProvided: z.boolean(),
      maxSignupsAllowed: z
        .string()
        .transform((val) => (val.trim() === '' ? null : Number(val)))
        .pipe(z.number().int().positive().nullable()),
    })
    .refine(
      (data) =>
        data.opportunityType !== 'in-person' ||
        (data.location !== null && data.location.trim().length > 0),
      {
        message: 'Location is required for in-person opportunities',
        path: ['location'],
      },
    )
    .refine((data) => data.endTime > data.startTime, {
      message: 'End time must be after start time',
      path: ['endTime'],
    })
    .refine((data) => !needsTimeZone(data) || data.timeZone !== null, {
      message: 'Select a timezone for this opportunity',
      path: ['timeZone'],
    })
    .refine(
      (data) =>
        data.maxSignupsAllowed === null ||
        data.maxSignupsAllowed >= minCapacity,
      {
        message:
          minCapacity > 0
            ? `Capacity can't be less than the ${minCapacity} existing signup${minCapacity === 1 ? '' : 's'}`
            : undefined,
        path: ['maxSignupsAllowed'],
      },
    )
    .transform((data) => {
      const zone = (needsTimeZone(data) && data.timeZone) || fallbackTimeZone;
      return {
        ...data,
        startTime: fromZonedTime(data.startTime, zone),
        endTime: fromZonedTime(data.endTime, zone),
      };
    });
}

export type OpportunityFormSchema = ReturnType<
  typeof buildOpportunityFormSchema
>;
