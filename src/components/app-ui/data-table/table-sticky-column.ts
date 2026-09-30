import { cn } from '@/lib/utils';

export function stickyHeadClassName(index: number, columnId: string) {
  return cn(
    index === 0 && 'pl-4',
    columnId === 'actions' &&
      'sticky right-0 z-10 border-l bg-muted text-center',
  );
}

export function stickyCellClassName(index: number, columnId: string) {
  return cn(
    index === 0 && 'pl-4',
    columnId === 'actions' &&
      'sticky right-0 z-10 border-l bg-background text-center group-hover:bg-muted group-data-[state=selected]:bg-muted',
  );
}
