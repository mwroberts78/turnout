export function AppDateTime({
  start,
  end,
  timeZone,
}: {
  start: Date;
  end: Date;
  timeZone?: string | null;
}) {
  const date = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timeZone ?? undefined,
  });

  const startLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone ?? undefined,
  });

  const endLabel = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone ?? undefined,
  });

  return (
    <div className="flex flex-col">
      <span>{date}</span>
      <span className="text-muted-foreground text-xs">
        {startLabel} - {endLabel}
      </span>
    </div>
  );
}
