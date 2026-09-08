import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/base-ui/input';
import { Kbd, KbdGroup } from '@/components/base-ui/kbd';
import { cn } from '@/lib/utils';

export function TableSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(/Mac/.test(navigator.platform));
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isShortcut = isMac
        ? e.metaKey && e.key === 'k'
        : e.ctrlKey && e.key === 'k';
      if (isShortcut) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isMac]);

  return (
    <div className={cn('relative max-w-sm', className)}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-sm"
      />
      <KbdGroup className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 md:flex">
        <Kbd>{isMac ? '⌘K' : 'Ctrl+K'}</Kbd>
      </KbdGroup>
    </div>
  );
}
