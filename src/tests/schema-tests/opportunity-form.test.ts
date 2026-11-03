import { fromZonedTime } from 'date-fns-tz';
import { describe, expect, it } from 'vitest';
import {
  buildOpportunityFormSchema,
  needsTimeZone,
} from '@/lib/schemas/opportunity-form';

const schema = buildOpportunityFormSchema(0, 'America/New_York');

const validVirtual = {
  title: 'Park cleanup',
  description: null,
  opportunityType: 'virtual',
  location: null,
  imageUrl: null,
  startTime: '2026-10-10T10:00',
  endTime: '2026-10-10T12:00',
  timeZone: null,
  hasPhysicalLocation: false,
  mealProvided: false,
  mealOptions: [],
  tshirtProvided: false,
  maxSignupsAllowed: '',
};

const validSkillsBased = {
  title: 'Park cleanup',
  description: null,
  opportunityType: 'skills-based',
  location: null,
  imageUrl: null,
  startTime: '2026-10-10T10:00',
  endTime: '2026-10-10T12:00',
  timeZone: null,
  hasPhysicalLocation: false,
  mealProvided: false,
  mealOptions: [],
  tshirtProvided: false,
  maxSignupsAllowed: '',
};

const validInPerson = {
  title: 'Park cleanup',
  description: null,
  opportunityType: 'in-person',
  location: 'Test Location',
  imageUrl: null,
  startTime: '2026-10-10T10:00',
  endTime: '2026-10-10T12:00',
  timeZone: 'America/New_York',
  hasPhysicalLocation: false,
  mealProvided: false,
  mealOptions: [],
  tshirtProvided: false,
  maxSignupsAllowed: '',
};

describe('buildOpportunityFormSchema', () => {
  describe('booleans', () => {
    it('rejects a missing hasPhysicalLocation and points the error at hasPhysicalLocation', () => {
      const result = schema.safeParse({
        ...validVirtual,
        hasPhysicalLocation: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['hasPhysicalLocation']);
    });

    it('rejects a missing mealProvided and points the error at mealProvided', () => {
      const result = schema.safeParse({
        ...validVirtual,
        mealProvided: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['mealProvided']);
    });

    it('rejects a missing tshirtProvided and points the error at tshirtProvided', () => {
      const result = schema.safeParse({
        ...validVirtual,
        tshirtProvided: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['tshirtProvided']);
    });

    it('accepts virtual opportunity with mealProvided and tshirtProvided set', () => {
      const result = schema.safeParse({
        ...validVirtual,
        tshirtProvided: true,
        mealProvided: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('opportunity type', () => {
    it('accepts a valid virtual opportunity', () => {
      expect(schema.safeParse(validVirtual).success).toBe(true);
    });

    it('accepts a valid in-person opportunity', () => {
      expect(schema.safeParse(validInPerson).success).toBe(true);
    });

    it('accepts a valid skills-based opportunity', () => {
      expect(schema.safeParse(validSkillsBased).success).toBe(true);
    });

    it('rejects an invalid opportunity type and points the error at opportunityType', () => {
      const result = schema.safeParse({
        ...validInPerson,
        opportunityType: 'invalid-type',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['opportunityType']);
      expect(result.error?.issues[0].message).toBe(
        'Please select an opportunity type',
      );
    });

    it('rejects a missing opportunity type and points the error at opportunityType', () => {
      const result = schema.safeParse({
        ...validInPerson,
        opportunityType: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['opportunityType']);
      expect(result.error?.issues[0].message).toBe(
        'Please select an opportunity type',
      );
    });
  });

  describe('description', () => {
    it('treats a blank description as null', () => {
      const result = schema.safeParse({
        ...validInPerson,
        description: ' ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.description).toBeNull();
    });

    it('trims extraneous spaces from the description', () => {
      const result = schema.safeParse({
        ...validInPerson,
        description: ' test description ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe('test description');
    });

    it('keeps a real description unchanged', () => {
      const result = schema.safeParse({
        ...validInPerson,
        description: 'test description',
      });

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe('test description');
    });
  });

  describe('title', () => {
    it('rejects a whitespace-only title and points the error at title', () => {
      const result = schema.safeParse({ ...validInPerson, title: ' ' });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['title']);
      expect(result.error?.issues[0].message).toBe(
        'Opportunity title must be at least 2 characters',
      );
    });

    it('trims extraneous spaces from the title', () => {
      const result = schema.safeParse({
        ...validInPerson,
        title: ' test title ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('test title');
    });

    it('rejects a one character title and points the error at title', () => {
      const result = schema.safeParse({ ...validInPerson, title: 'a' });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['title']);
      expect(result.error?.issues[0].message).toBe(
        'Opportunity title must be at least 2 characters',
      );
    });

    it('accepts a two character title', () => {
      const result = schema.safeParse({
        ...validInPerson,
        title: 'ab',
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('ab');
    });
  });

  describe('times', () => {
    it('rejects an empty start time and points the error at startTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        startTime: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['startTime']);
      expect(result.error?.issues[0].message).toBe('Start time is required');
    });

    it('rejects an empty end time and points the error at endTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        endTime: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['endTime']);
      expect(result.error?.issues[0].message).toBe('End time is required');
    });

    it('rejects a whitespace-only start time and points the error at startTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        startTime: ' ',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['startTime']);
      expect(result.error?.issues[0].message).toBe('Start time is required');
    });

    it('rejects a whitespace-only end time and points the error at endTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        endTime: ' ',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['endTime']);
      expect(result.error?.issues[0].message).toBe('End time is required');
    });

    it('rejects a start time that is not a valid date and points the error at startTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        startTime: 'abc',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['startTime']);
      expect(result.error?.issues[0].message).toBe(
        'Start time must be a valid date and time',
      );
    });

    it('rejects an end time that is not a valid date and points the error at endTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        endTime: 'abc',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['endTime']);
      expect(result.error?.issues[0].message).toBe(
        'End time must be a valid date and time',
      );
    });

    it('trims extraneous spaces from the start time', () => {
      const result = schema.safeParse({
        ...validInPerson,
        startTime: ' 2026-10-10T10:00 ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.startTime).toEqual(
        fromZonedTime('2026-10-10T10:00', validInPerson.timeZone),
      );
    });

    it('trims extraneous spaces from the end time', () => {
      const result = schema.safeParse({
        ...validInPerson,
        endTime: ' 2026-10-10T12:00 ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.endTime).toEqual(
        fromZonedTime('2026-10-10T12:00', validInPerson.timeZone),
      );
    });

    it('rejects an end time equal to the start time and points the error at endTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        endTime: '2026-10-10T10:00',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['endTime']);
      expect(result.error?.issues[0].message).toBe(
        'End time must be after start time',
      );
    });

    it('rejects an end time before the start time and points the error at endTime', () => {
      const result = schema.safeParse({
        ...validInPerson,
        endTime: '2026-10-10T09:00',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['endTime']);
      expect(result.error?.issues[0].message).toBe(
        'End time must be after start time',
      );
    });

    it('accepts an end time after the start time', () => {
      const result = schema.safeParse({
        ...validInPerson,
        startTime: '2026-10-10T08:00',
        endTime: '2026-10-10T09:00',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('image', () => {
    it('treats a blank imageUrl as null', () => {
      const result = schema.safeParse({
        ...validInPerson,
        imageUrl: ' ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.imageUrl).toBeNull();
    });
  });

  describe('meal options', () => {
    it('rejects an empty meal name and points the error at mealName in mealOptions', () => {
      const result = schema.safeParse({
        ...validInPerson,
        mealOptions: [
          {
            mealName: '',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual([
        'mealOptions',
        0,
        'mealName',
      ]);
      expect(result.error?.issues[0].message).toBe('Meal name is required');
    });

    it('rejects a whitespace-only meal name and points the error at mealName in mealOptions', () => {
      const result = schema.safeParse({
        ...validInPerson,
        mealOptions: [
          {
            mealName: ' ',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual([
        'mealOptions',
        0,
        'mealName',
      ]);
      expect(result.error?.issues[0].message).toBe('Meal name is required');
    });

    it('trims extraneous spaces from the meal name', () => {
      const result = schema.safeParse({
        ...validInPerson,
        mealOptions: [
          {
            mealName: ' test meal name ',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data?.mealOptions[0].mealName).toBe('test meal name');
    });

    it('accepts a valid meal option', () => {
      const result = schema.safeParse({
        ...validInPerson,
        mealOptions: [
          {
            mealName: 'test meal name',
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data?.mealOptions[0].mealName).toBe('test meal name');
    });
  });

  describe('max signups', () => {
    it('treats a blank maxSignupsAllowed as null', () => {
      const result = schema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '',
      });

      expect(result.success).toBe(true);
      expect(result.data?.maxSignupsAllowed).toBeNull();
    });

    it('rejects 0 and points the error at maxSignupsAllowed', () => {
      const result = schema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '0',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['maxSignupsAllowed']);
    });

    it('rejects a decimal value and points the error at maxSignupsAllowed', () => {
      const result = schema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '1.5',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['maxSignupsAllowed']);
    });

    it('rejects a non-numeric value and points the error at maxSignupsAllowed', () => {
      const result = schema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: 'abc',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['maxSignupsAllowed']);
    });

    it('rejects a negative value and points the error at maxSignupsAllowed', () => {
      const result = schema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '-1',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['maxSignupsAllowed']);
    });

    it('accepts a positive whole number string and converts it to a number', () => {
      const result = schema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '5',
      });

      expect(result.success).toBe(true);
      expect(result.data?.maxSignupsAllowed).toBe(5);
    });
  });

  describe('time zone', () => {
    it('rejects a missing time zone for an in-person opportunity and points the error at timeZone', () => {
      const result = schema.safeParse({
        ...validInPerson,
        timeZone: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['timeZone']);
      expect(result.error?.issues[0].message).toBe(
        'Select a timezone for this opportunity',
      );
    });

    it('rejects a whitespace-only time zone for an in-person opportunity and points the error at timeZone', () => {
      const result = schema.safeParse({
        ...validInPerson,
        timeZone: ' ',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['timeZone']);
      expect(result.error?.issues[0].message).toBe(
        'Select a timezone for this opportunity',
      );
    });

    it('rejects an invalid time zone for an in-person opportunity and points the error at timeZone', () => {
      const result = schema.safeParse({
        ...validInPerson,
        timeZone: 'NotA/TimeZone',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['timeZone']);
      expect(result.error?.issues[0].message).toBe(
        'Select a timezone for this opportunity',
      );
    });

    it('accepts a missing time zone for a virtual opportunity', () => {
      const result = schema.safeParse({
        ...validVirtual,
        timeZone: '',
      });

      expect(result.success).toBe(true);
      expect(result.data?.timeZone).toBeNull();
    });

    it('accepts an in-person opportunity with a location and a valid time zone', () => {
      const result = schema.safeParse({
        ...validInPerson,
        timeZone: 'America/Chicago',
      });

      expect(result.success).toBe(true);
      expect(result.data?.timeZone).toBe('America/Chicago');
    });

    it('rejects a missing time zone for skills-based with a physical location and points the error at timeZone', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        hasPhysicalLocation: true,
        location: 'location',
        timeZone: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['timeZone']);
      expect(result.error?.issues[0].message).toBe(
        'Select a timezone for this opportunity',
      );
    });

    it('accepts skills-based with a physical location and a valid time zone', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        hasPhysicalLocation: true,
        location: 'location',
        timeZone: 'America/New_York',
      });

      expect(result.success).toBe(true);
      expect(result.data?.hasPhysicalLocation).toBe(true);
      expect(result.data?.location).toBe('location');
      expect(result.data?.timeZone).toBe('America/New_York');
    });

    it('accepts skills-based without a physical location and no time zone', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        hasPhysicalLocation: false,
        location: '',
        timeZone: '',
      });

      expect(result.success).toBe(true);
      expect(result.data?.hasPhysicalLocation).toBe(false);
      expect(result.data?.location).toBeNull();
      expect(result.data?.timeZone).toBeNull();
    });

    it('sets timeZone to null for a virtual opportunity even if one is submitted', () => {
      const result = schema.safeParse({
        ...validVirtual,
        timeZone: 'America/Chicago',
      });

      expect(result.success).toBe(true);
      expect(result.data?.timeZone).toBeNull();
    });

    it('sets timeZone to null for skills-based without a physical location even if one is submitted', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        hasPhysicalLocation: false,
        location: '',
        timeZone: 'America/Chicago',
      });

      expect(result.success).toBe(true);
      expect(result.data?.timeZone).toBeNull();
    });
  });

  describe('location', () => {
    it('rejects a missing location for an in-person opportunity and points the error at location', () => {
      const result = schema.safeParse({
        ...validVirtual,
        opportunityType: 'in-person',
        timeZone: 'America/New_York',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['location']);
      expect(result.error?.issues[0].message).toBe(
        'Location is required for this opportunity',
      );
    });

    it('rejects a whitespace-only location for an in-person opportunity and points the error at location', () => {
      const result = schema.safeParse({
        ...validInPerson,
        opportunityType: 'in-person',
        timeZone: 'America/New_York',
        location: ' ',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['location']);
      expect(result.error?.issues[0].message).toBe(
        'Location is required for this opportunity',
      );
    });

    it('accepts a real address for an in-person opportunity', () => {
      const result = schema.safeParse({
        ...validInPerson,
        location: 'Actual Address',
      });

      expect(result.success).toBe(true);
      expect(result.data?.location).toBe('Actual Address');
    });

    it('accepts a missing location for a virtual opportunity', () => {
      const result = schema.safeParse({
        ...validVirtual,
        location: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.location).toBeNull();
    });

    it('treats a whitespace-only location as null for a virtual opportunity', () => {
      const result = schema.safeParse({
        ...validVirtual,
        location: ' ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.location).toBeNull();
    });

    it('trims extraneous spaces from the location', () => {
      const result = schema.safeParse({
        ...validInPerson,
        location: ' Actual Address ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.location).toBe('Actual Address');
    });

    it('rejects a missing location for a skills-based opportunity with hasPhysicalLocation: true and no location and points the error at location', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        hasPhysicalLocation: true,
        location: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['location']);
      expect(result.error?.issues[0].message).toBe(
        'Location is required for this opportunity',
      );
    });
  });

  describe('capacity', () => {
    it('rejects a value below minCapacity and points the error at maxSignupsAllowed', () => {
      const minCapacitySchema = buildOpportunityFormSchema(
        3,
        'America/Chicago',
      );

      const result = minCapacitySchema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '2',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['maxSignupsAllowed']);
      expect(result.error?.issues[0].message).toBe(
        `Capacity can't be less than the 3 existing signups`,
      );
    });

    it('accepts a value equal to minCapacity', () => {
      const minCapacitySchema = buildOpportunityFormSchema(
        3,
        'America/Chicago',
      );

      const result = minCapacitySchema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '3',
      });

      expect(result.success).toBe(true);
      expect(result.data?.maxSignupsAllowed).toBe(3);
    });

    it('accepts a blank maxSignupsAllowed even when minCapacity is set', () => {
      const minCapacitySchema = buildOpportunityFormSchema(
        3,
        'America/Chicago',
      );

      const result = minCapacitySchema.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '',
      });

      expect(result.success).toBe(true);
      expect(result.data?.maxSignupsAllowed).toBeNull();
    });

    it('uses plural wording in the capacity message (e.g. "2 existing signups")', () => {
      const minCapacitySchemaPlural = buildOpportunityFormSchema(
        3,
        'America/Chicago',
      );

      const resultPlural = minCapacitySchemaPlural.safeParse({
        ...validInPerson,
        maxSignupsAllowed: '2',
      });

      expect(resultPlural.error?.issues[0].path).toEqual(['maxSignupsAllowed']);
      expect(resultPlural.error?.issues[0].message).toBe(
        `Capacity can't be less than the 3 existing signups`,
      );
    });
  });

  describe('needsTimeZone', () => {
    it('returns true for in-person', () => {
      const timeZoneNeeded = needsTimeZone({
        opportunityType: 'in-person',
        hasPhysicalLocation: true,
      });

      expect(timeZoneNeeded).toBe(true);
    });

    it('returns true for skills-based with a physical location', () => {
      const timeZoneNeeded = needsTimeZone({
        opportunityType: 'skills-based',
        hasPhysicalLocation: true,
      });

      expect(timeZoneNeeded).toBe(true);
    });

    it('returns false for skills-based with no physical location', () => {
      const timeZoneNeeded = needsTimeZone({
        opportunityType: 'skills-based',
        hasPhysicalLocation: false,
      });

      expect(timeZoneNeeded).toBe(false);
    });

    it('returns false for virtual', () => {
      const timeZoneNeeded = needsTimeZone({
        opportunityType: 'virtual',
        hasPhysicalLocation: true,
      });

      expect(timeZoneNeeded).toBe(false);
    });
  });

  describe('transform', () => {
    it('converts an in-person start time using its own venue time zone rather than the fallback', () => {
      const result = schema.safeParse({
        ...validInPerson,
        timeZone: 'America/Los_Angeles',
      });

      expect(result.success).toBe(true);
      expect(result.data?.startTime).toEqual(
        fromZonedTime(validInPerson.startTime, 'America/Los_Angeles'),
      );
    });

    it('converts an in-person end time using its own venue time zone rather than the fallback', () => {
      const result = schema.safeParse({
        ...validInPerson,
        timeZone: 'America/Los_Angeles',
      });

      expect(result.success).toBe(true);
      expect(result.data?.endTime).toEqual(
        fromZonedTime(validInPerson.endTime, 'America/Los_Angeles'),
      );
    });

    it('converts a skills-based-with-physical-location start time using its own venue time zone rather than the fallback', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        hasPhysicalLocation: true,
        location: 'location',
        timeZone: 'America/Los_Angeles',
      });

      expect(result.success).toBe(true);
      expect(result.data?.startTime).toEqual(
        fromZonedTime(validSkillsBased.startTime, 'America/Los_Angeles'),
      );
    });

    it('converts the times for a virtual opportunity using the fallback time zone', () => {
      const result = schema.safeParse({
        ...validVirtual,
        timeZone: 'America/Los_Angeles',
      });

      expect(result.success).toBe(true);
      expect(result.data?.startTime).toEqual(
        fromZonedTime(validVirtual.startTime, 'America/New_York'),
      );
    });

    it('converts a skills-based opportunity without a physical location using the fallback time zone, even if one is submitted', () => {
      const result = schema.safeParse({
        ...validSkillsBased,
        location: '',
        timeZone: 'America/Los_Angeles',
      });

      expect(result.success).toBe(true);
      expect(result.data?.startTime).toEqual(
        fromZonedTime(validSkillsBased.startTime, 'America/New_York'),
      );
    });

    it('converts in-person times with a different offset in winter than in summer', () => {
      const summerResult = schema.safeParse({
        ...validInPerson,
        startTime: '2026-07-10T10:00',
        endTime: '2026-07-10T12:00',
      });

      const winterResult = schema.safeParse({
        ...validInPerson,
        startTime: '2026-01-10T10:00',
        endTime: '2026-01-10T12:00',
      });

      expect(summerResult.success).toBe(true);
      expect(summerResult.data?.startTime).toEqual(
        fromZonedTime('2026-07-10T10:00', 'America/New_York'),
      );

      expect(winterResult.success).toBe(true);
      expect(winterResult.data?.startTime).toEqual(
        fromZonedTime('2026-01-10T10:00', 'America/New_York'),
      );

      expect(summerResult.data?.startTime.getUTCHours()).not.toBe(
        winterResult.data?.startTime.getUTCHours(),
      );
    });
  });

  describe('multiple errors', () => {
    it('returns every applicable business-rule error together when more than one refine fails', () => {
      const result = schema.safeParse({
        ...validInPerson,
        location: null,
        endTime: '2026-10-10T09:00',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(2);
      expect(result.error?.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['location'], ['endTime']]),
      );
    });

    it('returns only the field-level error and skips business-rule checks when a basic field is also invalid', () => {
      const result = schema.safeParse({
        ...validInPerson,
        title: undefined,
        endTime: '2026-10-10T09:00',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['title']]),
      );
    });
  });
});
