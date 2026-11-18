import {
  CalendarCheck,
  ClipboardList,
  Clock,
  Download,
  Hourglass,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { AppStatCard } from '@/components/app-ui/app-stat-card';
import { Button } from '@/components/base-ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/base-ui/table';
import { getTenantReport } from '@/lib/dal/report';
import type { ReportExportType } from '@/lib/reports/reportCsv';
import { formatHours } from '@/lib/utils/formatHours';
import type { ReportRange } from '@/lib/utils/reportRange';

function ExportButton({
  type,
  range,
}: {
  type: ReportExportType;
  range: ReportRange;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      render={
        // biome-ignore lint/a11y/useAnchorContent: content is passed as Button children
        <a href={`/api/reports/export?type=${type}&range=${range}`} download />
      }
      nativeButton={false}
    >
      <Download />
      CSV
    </Button>
  );
}

function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-6 text-center text-muted-foreground"
      >
        {children}
      </TableCell>
    </TableRow>
  );
}

export async function ReportsSection({
  tenantId,
  range,
}: {
  tenantId: string;
  range: ReportRange;
}) {
  const { totals, byOpportunity, byVolunteer, byProject } =
    await getTenantReport(tenantId, range);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <AppStatCard
          label="Hours volunteered"
          value={formatHours(totals.hours)}
          icon={Clock}
          description={`${totals.completed} completed signups`}
        />
        <AppStatCard
          label="Volunteers"
          value={totals.volunteers}
          icon={Users}
          description={`${Math.round(totals.participationRate * 100)}% of ${totals.activeEmployees} employees`}
        />
        <AppStatCard
          label="Opportunities held"
          value={totals.opportunities}
          icon={ClipboardList}
          description={`${totals.signups} signups`}
        />
        <AppStatCard
          label="Hours not logged"
          value={totals.notLogged}
          icon={Hourglass}
          description="Past signups not marked completed"
        />
        <AppStatCard
          label="Upcoming signups"
          value={totals.upcomingSignups}
          icon={CalendarCheck}
          description="Across future opportunities"
        />
      </div>

      <AppInfoCard
        title="By opportunity"
        action={<ExportButton type="opportunities" range={range} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Signups</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byOpportunity.length === 0 ? (
              <EmptyRow colSpan={5}>No opportunities in this period.</EmptyRow>
            ) : (
              byOpportunity.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="max-w-64 truncate font-medium">
                    <Link
                      href={`/opportunities/manage/${o.id}`}
                      className="hover:underline"
                    >
                      {o.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <AppDateTime
                      start={o.startTime}
                      end={o.endTime}
                      timeZone={o.timeZone}
                      variant="inline"
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.signupCount}
                    {o.maxSignupsAllowed !== null && (
                      <span className="text-muted-foreground">
                        {' '}
                        / {o.maxSignupsAllowed}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.completedCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.hours}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AppInfoCard>

      {byProject.length > 0 && (
        <AppInfoCard
          title="By project"
          action={<ExportButton type="projects" range={range} />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Opportunities</TableHead>
                <TableHead className="text-right">Signups</TableHead>
                <TableHead className="text-right">Volunteers</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProject.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-64 truncate font-medium">
                    <Link
                      href={`/projects/manage/${p.id}`}
                      className="hover:underline"
                    >
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.opportunityCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.signupCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.volunteerCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.hours}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppInfoCard>
      )}

      <AppInfoCard
        title="By volunteer"
        action={<ExportButton type="volunteers" range={range} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Signups</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byVolunteer.length === 0 ? (
              <EmptyRow colSpan={5}>No volunteers in this period.</EmptyRow>
            ) : (
              byVolunteer.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    {v.firstName} {v.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.email}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.signupCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.completedCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.hours}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AppInfoCard>
    </div>
  );
}
