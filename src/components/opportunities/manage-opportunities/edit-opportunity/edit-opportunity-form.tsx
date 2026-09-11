import { z } from 'zod';
import { opportunityTypeEnum } from '@/db/schema';

const opportunityFormSchema = z
  .object({
    title: z
      .string()
      .min(2, { message: 'Opportunity title must be at least 2 characters' }),
    description: z.string().nullable(),
    opportunityType: z.enum(opportunityTypeEnum.enumValues),
    location: z.string().nullable(),
    imageUrl: z.string().nullable(),
    startTime: z.date(),
    endTime: z.date(),
    timeZone: z.string().nullable(),
    hasPhysicalLocation: z.boolean(),
    mealProvided: z.boolean(),
    tshirtProvided: z.boolean(),
    maxSignupsAllowed: z.number().nullable(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine(
    (data) => {
      const needsTimeZone =
        data.opportunityType === 'in-person' ||
        (data.opportunityType === 'skills-based' && data.hasPhysicalLocation);

      return !needsTimeZone || data.timeZone !== null;
    },
    {
      message: 'Select a timezone for this opportunity',
      path: ['timeZone'],
    },
  );

export function EditOpportunityForm({ oppId }: { oppId?: string }) {
  if (!oppId) return <div>New</div>;
  return <div>Edit</div>;
}
