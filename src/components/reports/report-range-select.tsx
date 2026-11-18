'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Label } from '@/components/base-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
import {
  type ReportRange,
  reportRangeLabels,
  reportRanges,
} from '@/lib/utils/reportRange';

export function ReportRangeSelect({ range }: { range: ReportRange }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="report-range">Period</Label>
      <Select
        value={range}
        onValueChange={(value) => router.push(`${pathname}?range=${value}`)}
      >
        <SelectTrigger id="report-range" className="w-40">
          <SelectValue>
            {(value: ReportRange) => reportRangeLabels[value]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {reportRanges.map((value) => (
            <SelectItem key={value} value={value}>
              {reportRangeLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
