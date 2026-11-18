import { describe, expect, it } from 'vitest';
import {
  formatWhen,
  hoursUpdatedEmail,
  opportunityChangedEmail,
  signupConfirmedEmail,
  signupRemovedEmail,
} from '@/lib/email/templates';

const recipient = { email: 'avery@example.com', firstName: 'Avery' };

const opportunity = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Park Cleanup',
  startTime: new Date('2026-12-05T15:00:00Z'),
  endTime: new Date('2026-12-05T17:00:00Z'),
  timeZone: 'America/New_York',
  location: 'Riverside Park',
};

describe('formatWhen', () => {
  it("uses the opportunity's own time zone", () => {
    expect(formatWhen(opportunity)).toBe(
      'Sat, Dec 5, 2026, 10:00 AM – 12:00 PM EST',
    );
  });

  it('falls back to UTC for opportunities without a time zone', () => {
    expect(formatWhen({ ...opportunity, timeZone: null })).toBe(
      'Sat, Dec 5, 2026, 3:00 – 5:00 PM UTC',
    );
  });
});

describe('email templates', () => {
  it('addresses the volunteer and lists what they signed up for', () => {
    const email = signupConfirmedEmail(recipient, opportunity, {
      estimatedHours: 2,
      mealName: 'Pizza',
      tshirtSize: 'lg',
    });

    expect(email.to).toBe('avery@example.com');
    expect(email.subject).toBe("You're signed up: Park Cleanup");
    expect(email.text).toContain('Hi Avery,');
    expect(email.text).toContain('Estimated hours: 2 hrs');
    expect(email.text).toContain('Meal: Pizza');
    expect(email.text).toContain('T-shirt: Large');
    expect(email.text).toContain(
      'View my signups: http://localhost:3000/my-signups',
    );
  });

  it('leaves out meal and t-shirt lines when none were chosen', () => {
    const email = signupConfirmedEmail(recipient, opportunity, {
      estimatedHours: 1,
      mealName: null,
      tshirtSize: null,
    });

    expect(email.text).not.toContain('Meal:');
    expect(email.text).not.toContain('T-shirt:');
  });

  it('shows Remote for opportunities without a location', () => {
    const email = signupRemovedEmail(recipient, {
      ...opportunity,
      location: null,
    });

    expect(email.text).toContain('Where: Remote');
  });

  it('escapes user-entered text in the HTML', () => {
    const email = signupRemovedEmail(
      { ...recipient, firstName: '<b>Avery</b>' },
      { ...opportunity, title: '<script>alert(1)</script> & friends' },
    );

    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<b>Avery</b>');
    expect(email.html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; friends',
    );
  });

  it('describes the logged hours when an admin updates them', () => {
    expect(
      hoursUpdatedEmail(recipient, opportunity, {
        workCompleted: true,
        hours: 3.5,
      }).text,
    ).toContain('Status: Completed, 3.5 hrs');
    expect(
      hoursUpdatedEmail(recipient, opportunity, {
        workCompleted: false,
        hours: 2,
      }).text,
    ).toContain('Status: Not marked completed');
  });

  it('links a changed opportunity to its page', () => {
    expect(opportunityChangedEmail(recipient, opportunity).text).toContain(
      `View opportunity: http://localhost:3000/opportunities/view/${opportunity.id}`,
    );
  });
});
