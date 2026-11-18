import { describe, expect, it } from 'vitest';
import {
  defaultBrowseFilters,
  filterOpportunities,
  spotsLeft,
} from '@/lib/utils/browseOpportunities';

function opportunity(
  title: string,
  overrides: Partial<Parameters<typeof spotsLeft>[0]> = {},
) {
  return {
    title,
    description: null,
    location: null,
    projectTitle: null,
    opportunityType: 'virtual' as const,
    startTime: new Date('2026-12-01T14:00:00Z'),
    signupCount: 0,
    maxSignupsAllowed: null,
    ...overrides,
  };
}

const titles = (list: { title: string }[]) => list.map((o) => o.title);

describe('spotsLeft', () => {
  it('treats unlimited capacity as infinite and never goes negative', () => {
    expect(spotsLeft(opportunity('a'))).toBe(Number.POSITIVE_INFINITY);
    expect(
      spotsLeft(opportunity('b', { maxSignupsAllowed: 3, signupCount: 5 })),
    ).toBe(0);
  });
});

describe('filterOpportunities', () => {
  const list = [
    opportunity('Park cleanup', {
      opportunityType: 'in-person',
      location: 'Riverside Park',
      startTime: new Date('2026-12-05T14:00:00Z'),
      maxSignupsAllowed: 10,
      signupCount: 2,
    }),
    opportunity('Resume workshop', {
      description: 'Help job seekers polish resumes',
      startTime: new Date('2026-12-02T14:00:00Z'),
      maxSignupsAllowed: 3,
      signupCount: 3,
    }),
    opportunity('Tree planting', {
      opportunityType: 'in-person',
      projectTitle: 'Earth Week',
      startTime: new Date('2026-12-03T14:00:00Z'),
    }),
  ];

  it('sorts soonest first by default', () => {
    expect(titles(filterOpportunities(list, defaultBrowseFilters))).toEqual([
      'Resume workshop',
      'Tree planting',
      'Park cleanup',
    ]);
  });

  it('searches title, description, location, and project, ignoring case', () => {
    const search = (term: string) =>
      titles(
        filterOpportunities(list, { ...defaultBrowseFilters, search: term }),
      );

    expect(search('PARK')).toEqual(['Park cleanup']);
    expect(search('job seekers')).toEqual(['Resume workshop']);
    expect(search('earth')).toEqual(['Tree planting']);
    expect(search('   ')).toHaveLength(3);
  });

  it('filters by type and hides full opportunities when asked', () => {
    expect(
      titles(
        filterOpportunities(list, {
          ...defaultBrowseFilters,
          type: 'in-person',
        }),
      ),
    ).toEqual(['Tree planting', 'Park cleanup']);
    expect(
      titles(
        filterOpportunities(list, { ...defaultBrowseFilters, openOnly: true }),
      ),
    ).toEqual(['Tree planting', 'Park cleanup']);
  });

  it('sorts by spots left, unlimited first, then by date', () => {
    expect(
      titles(
        filterOpportunities(list, {
          ...defaultBrowseFilters,
          sort: 'most-spots',
        }),
      ),
    ).toEqual(['Tree planting', 'Park cleanup', 'Resume workshop']);
  });

  it('does not mutate the input', () => {
    const copy = [...list];
    filterOpportunities(list, { ...defaultBrowseFilters, sort: 'most-spots' });
    expect(list).toEqual(copy);
  });
});
