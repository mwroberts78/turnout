'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useContext,
  useTransition,
} from 'react';

const TableRefreshContext = createContext<{
  isRefreshing: boolean;
  refresh: () => void;
} | null>(null);

export function TableRefreshProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  function refresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <TableRefreshContext.Provider value={{ isRefreshing, refresh }}>
      {children}
    </TableRefreshContext.Provider>
  );
}

export function useTableRefresh() {
  const context = useContext(TableRefreshContext);
  if (!context) {
    throw new Error(
      'useTableRefresh must be used within a TableRefreshProvider',
    );
  }

  return context;
}

export function TableRefreshOverlay() {
  const { isRefreshing } = useTableRefresh();

  if (!isRefreshing) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/60 pt-8 backdrop-blur-[1px]">
      <div className="flex items-center gap-2 rounded-md border bg-popover px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Refreshing...
      </div>
    </div>
  );
}
