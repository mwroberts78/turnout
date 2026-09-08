import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from '@/lib/utils';

export function AppSignupCapacity({
  count,
  max,
  showRemaining = false,
  className,
}: {
  count: number;
  max: number | null;
  showRemaining?: boolean;
  className?: string;
}) {
  if (max === null) {
    return (
      <span className={cn('text-muted-foreground text-sm', className)}>
        Unlimited
      </span>
    );
  }
  const percent = (count / max) * 100;

  function indicatorColorForPercent(percent: number): string {
    if (percent <= 50) return 'capacity-healthy';
    if (percent <= 85) return 'capacity-warning';
    return 'capacity-critical';
  }

  return (
    <ProgressPrimitive.Root
      value={percent}
      className="flex w-full max-w-sm items-center gap-3"
    >
      <ProgressPrimitive.Track className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full transition-all',
            indicatorColorForPercent(percent),
          )}
        />
      </ProgressPrimitive.Track>
      <ProgressPrimitive.Label className="whitespace-nowrap">
        {count}/{max}
        {showRemaining && ` · ${max - count} spots left`}
      </ProgressPrimitive.Label>
    </ProgressPrimitive.Root>
  );
}
