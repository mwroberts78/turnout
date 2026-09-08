import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/base-ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';

export function TablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  selectedCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onPageIndexChange,
  onPageSizeChange,
}: {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows: number;
  selectedCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageIndexChange: (index: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-4 border-t px-(--card-spacing) py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>
          Results: {startRow} - {endRow} of {totalRows}
          {selectedCount > 0 && ` · ${selectedCount} selected`}
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-17.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => (
          <Button
            // biome-ignore lint/suspicious/noArrayIndexKey: i is fine here.
            key={i}
            variant={pageIndex === i ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageIndexChange(i)}
          >
            {i + 1}
          </Button>
        ))}
        {pageCount > 5 && (
          <>
            <span className="text-muted-foreground px-2">...</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageIndexChange(pageCount - 1)}
            >
              {pageCount}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
