export function AppDateTime({ start, end }: { start: Date; end: Date }) {
  const date = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const startLabel = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const endLabel = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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
