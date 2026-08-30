import { z } from 'zod';
import { opportunityTypeEnum } from '@/db/schema';

export const opportunityListItem = z.object({
  id: z.string(),
  tenantId: z.string(),
  description: z.string(),
  opportunityType: z.enum(opportunityTypeEnum.enumValues),
  location: z.string().nullable(),
  imageUrl: z.string().nullable(),
  startTime: z.date(),
  endTime: z.date(),
  maxSignupsAllowed: z.number().nullable(),
});
