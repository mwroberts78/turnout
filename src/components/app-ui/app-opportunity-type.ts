import {
  GraduationCap,
  HandHeart,
  type LucideIcon,
  Monitor,
} from 'lucide-react';
import type { opportunityTypeEnum } from '@/db/schema';

export type OpportunityType = (typeof opportunityTypeEnum.enumValues)[number];

export const typeLabels: Record<
  (typeof opportunityTypeEnum.enumValues)[number],
  string
> = {
  'in-person': 'In Person',
  virtual: 'Virtual',
  'skills-based': 'Skills Based',
};

export const opportunityTypeIcons: Record<keyof typeof typeLabels, LucideIcon> =
  {
    'in-person': HandHeart,
    virtual: Monitor,
    'skills-based': GraduationCap,
  };
