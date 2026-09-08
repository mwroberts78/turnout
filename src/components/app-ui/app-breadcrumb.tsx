'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/base-ui/breadcrumb';

type PageCrumb = { label: string; parent?: string };

const pageCrumbs: Record<string, PageCrumb> = {
  '/dashboard': { label: 'Dashboard' },
  '/opportunities/manage': {
    label: 'Manage Opportunities',
    parent: '/dashboard',
  },
  '/opportunities/manage/[id]': {
    label: 'Opportunity',
    parent: '/opportunities/manage',
  },
  '/opportunities/manage/[id]/edit': {
    label: 'Edit',
    parent: '/opportunities/manage/[id]',
  },
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalize(pathname: string) {
  return pathname
    .split('/')
    .map((segment) => (uuidPattern.test(segment) ? '[id]' : segment))
    .join('/');
}

function resolveHref(
  pattern: string,
  normalized: string,
  realSegments: string[],
) {
  const patternSegments = pattern.split('/').filter(Boolean);
  const normalizedSegments = normalized.split('/').filter(Boolean);

  const resolved = patternSegments.map((segment) => {
    if (!segment.startsWith('[')) return segment;
    const index = normalizedSegments.indexOf(segment);
    return index === -1 ? segment : realSegments[index];
  });

  return `/${resolved.join('/')}`;
}

export function AppBreadcrumb({
  overrides,
}: {
  overrides?: Record<string, string>;
}) {
  const pathname = usePathname();
  const normalized = normalize(pathname);
  const realSegments = pathname.split('/').filter(Boolean);

  const trail: { href: string; label: string }[] = [];
  let current: string | undefined = normalized;

  while (current) {
    const config: PageCrumb | undefined = pageCrumbs[current];
    if (!config) break;

    const href = resolveHref(current, normalized, realSegments);

    trail.unshift({ href, label: overrides?.[current] ?? config.label });
    current = config.parent;
  }

  return (
    <Breadcrumb className="mb-2">
      <BreadcrumbList>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
