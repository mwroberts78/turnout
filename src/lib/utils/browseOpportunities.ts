import type { opportunityTypeEnum } from '@/db/schema';

type OpportunityType = (typeof opportunityTypeEnum.enumValues)[number];

export const browseSorts = ['soonest', 'most-spots'] as const;

export type BrowseSort = (typeof browseSorts)[number];

export const browseSortLabels: Record<BrowseSort, string> = {
  soonest: 'Soonest first',
  'most-spots': 'Most spots left',
};

export type BrowseFilters = {
  search: string;
  type: OpportunityType | 'all';
  openOnly: boolean;
  sort: BrowseSort;
};

export const defaultBrowseFilters: BrowseFilters = {
  search: '',
  type: 'all',
  openOnly: false,
  sort: 'soonest',
};

type Browsable = {
  title: string;
  description: string | null;
  location: string | null;
  projectTitle: string | null;
  opportunityType: OpportunityType;
  startTime: Date;
  signupCount: number;
  maxSignupsAllowed: number | null;
};

// Unlimited opportunities sort as having the most room.
export function spotsLeft(opportunity: Browsable) {
  return opportunity.maxSignupsAllowed === null
    ? Number.POSITIVE_INFINITY
    : Math.max(0, opportunity.maxSignupsAllowed - opportunity.signupCount);
}

export function filterOpportunities<T extends Browsable>(
  opportunities: T[],
  filters: BrowseFilters,
): T[] {
  const search = filters.search.trim().toLowerCase();

  const matching = opportunities.filter((o) => {
    if (filters.type !== 'all' && o.opportunityType !== filters.type) {
      return false;
    }
    if (filters.openOnly && spotsLeft(o) === 0) return false;
    if (!search) return true;

    return [o.title, o.description, o.location, o.projectTitle].some((field) =>
      (field ?? '').toLowerCase().includes(search),
    );
  });

  return matching.sort((a, b) => {
    if (filters.sort === 'most-spots') {
      const bySpots = spotsLeft(b) - spotsLeft(a);
      if (bySpots !== 0 && !Number.isNaN(bySpots)) return bySpots;
    }
    return a.startTime.getTime() - b.startTime.getTime();
  });
}
