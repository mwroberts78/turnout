import type { tshirtSizesEnum } from '@/db/schema';

export const tshirtSizeLabels: Record<
  (typeof tshirtSizesEnum.enumValues)[number],
  string
> = {
  xs: 'Extra small',
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra large',
  '2x': '2XL',
  '3x': '3XL',
};
