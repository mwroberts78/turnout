import { fromZonedTime } from 'date-fns-tz';
import { z } from 'zod';
import { opportunityTypeEnum } from '@/db/schema';
import { isValidTimeZone } from '../utils/isValidTimeZone';
import { numericStringToNullable } from './numeric-string';

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
        .trim()
        .min(2, { message: 'Opportunity title must be at least 2 characters' }),
      description: z
        .string()
        .trim()
        .nullable()
        .transform((value) => (value === '' ? null : value)),
      opportunityType: z.enum(
        opportunityTypeEnum.enumValues,
        'Please select an opportunity type',
      ),
      location: z
        .string()
        .trim()
        .nullable()
        .transform((value) => (value === '' ? null : value)),
      imageUrl: z
        .string()
        .trim()
        .nullable()
        .transform((value) => (value === '' ? null : value)),
      startTime: z
        .string()
        .trim()
        .min(1, { message: 'Start time is required' })
        .refine((value) => !Number.isNaN(Date.parse(value)), {
          message: 'Start time must be a valid date and time',
        }),
      endTime: z
        .string()
        .trim()
        .min(1, { message: 'End time is required' })
        .refine((value) => !Number.isNaN(Date.parse(value)), {
          message: 'End time must be a valid date and time',
        }),
      timeZone: z.string().nullable(),
      hasPhysicalLocation: z.boolean(),
      mealProvided: z.boolean(),
      mealOptions: z.array(
        z.object({
          mealOptionId: z.string().optional(),
          mealName: z.string().trim().min(1, 'Meal name is required'),
        }),
      ),
      tshirtProvided: z.boolean(),
      maxSignupsAllowed: numericStringToNullable(z.number().int().positive()),
    })
    .refine(
      (data) =>
        !needsTimeZone(data) ||
        (data.location !== null && data.location.trim().length > 0),
      {
        message: 'Location is required for this opportunity',
        path: ['location'],
      },
    )
    .refine((data) => data.endTime > data.startTime, {
      message: 'End time must be after start time',
      path: ['endTime'],
    })
    .refine(
      (data) =>
        !needsTimeZone(data) ||
        (data.timeZone !== null && isValidTimeZone(data.timeZone)),
      {
        message: 'Select a timezone for this opportunity',
        path: ['timeZone'],
      },
    )
    .refine(
      (data) =>
        data.maxSignupsAllowed === null ||
        data.maxSignupsAllowed >= minCapacity,
      {
        message:
          minCapacity > 0
            ? `Capacity can't be less than the ${minCapacity} existing signups`
            : undefined,
        path: ['maxSignupsAllowed'],
      },
    )
    .transform((data) => {
      const zone = (needsTimeZone(data) && data.timeZone) || fallbackTimeZone;
      return {
        ...data,
        timeZone: needsTimeZone(data) ? data.timeZone : null,
        startTime: fromZonedTime(data.startTime, zone),
        endTime: fromZonedTime(data.endTime, zone),
      };
    });
}

export type OpportunityFormSchema = ReturnType<
  typeof buildOpportunityFormSchema
>;
