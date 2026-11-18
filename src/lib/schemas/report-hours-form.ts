import { z } from 'zod';
import { requiredHoursString } from './numeric-string';

export const reportHoursFormSchema = z.object({
  actualHours: requiredHoursString('Hours are required'),
});
