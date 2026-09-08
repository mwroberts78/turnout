import {
  GraduationCap,
  HandHeart,
  type LucideIcon,
  Monitor,
} from 'lucide-react';
import type { typeLabels } from '@/db/schema';
import { cn } from '@/lib/utils';

const opportunityTypeIcons: Record<keyof typeof typeLabels, LucideIcon> = {
  'in-person': HandHeart,
  virtual: Monitor,
  'skills-based': GraduationCap,
};

export default function AppOpportunityTypeBlock({
  oppType,
}: {
  oppType: keyof typeof typeLabels;
}) {
  const TypeIcon = opportunityTypeIcons[oppType];
  return (
    <div
      className={cn('flex h-full w-full items-center justify-center', oppType)}
    >
      <TypeIcon className="size-16 opacity-50" />
    </div>
  );
}
