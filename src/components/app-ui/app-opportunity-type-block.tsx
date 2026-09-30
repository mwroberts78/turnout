import { cn } from '@/lib/utils';
import { opportunityTypeIcons, type typeLabels } from './app-opportunity-type';

export function AppOpportunityTypeBlock({
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
