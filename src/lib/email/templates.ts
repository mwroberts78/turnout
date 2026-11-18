import { tshirtSizeLabels } from '@/components/app-ui/app-tshirt-size';
import { APP_NAME } from '../constants/app';
import { formatHours } from '../utils/formatHours';
import { appUrl } from './config';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailRecipient = { email: string; firstName: string };

export type EmailOpportunity = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  timeZone: string | null;
  location: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Opportunities without a fixed time zone (virtual ones) are shown in UTC;
// the app itself converts them to each viewer's local time.
export function formatWhen(opportunity: EmailOpportunity) {
  const format = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: opportunity.timeZone ?? 'UTC',
    timeZoneName: 'short',
  });

  // Intl uses narrow and thin no-break spaces around times, which some email
  // clients render as stray characters.
  return format
    .formatRange(opportunity.startTime, opportunity.endTime)
    .replace(/[\u202f\u2009]/g, ' ');
}

function opportunityDetails(opportunity: EmailOpportunity): [string, string][] {
  return [
    ['Opportunity', opportunity.title],
    ['When', formatWhen(opportunity)],
    ['Where', opportunity.location || 'Remote'],
  ];
}

function renderEmail({
  to,
  subject,
  recipient,
  paragraphs,
  details,
  action,
}: {
  to: string;
  subject: string;
  recipient: EmailRecipient;
  paragraphs: string[];
  details: [string, string][];
  action: { label: string; path: string };
}): EmailMessage {
  const href = `${appUrl()}${action.path}`;
  const greeting = `Hi ${recipient.firstName || 'there'},`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr><td>
        <p style="margin:0 0 24px;font-weight:600;font-size:18px;">${escapeHtml(APP_NAME)}</p>
        <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
        ${paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(p)}</p>`).join('\n        ')}
        <table role="presentation" style="margin:8px 0 24px;border-collapse:collapse;font-size:14px;">
          ${details
            .map(
              ([label, value]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#71717a;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
            )
            .join('\n          ')}
        </table>
        <a href="${escapeHtml(href)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">${escapeHtml(action.label)}</a>
        <p style="margin:32px 0 0;font-size:12px;color:#71717a;">You're receiving this because of your volunteer activity on ${escapeHtml(APP_NAME)}.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    greeting,
    '',
    ...paragraphs.flatMap((p) => [p, '']),
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    `${action.label}: ${href}`,
  ].join('\n');

  return { to, subject, html, text };
}

const mySignups = { label: 'View my signups', path: '/my-signups' };

export function signupConfirmedEmail(
  recipient: EmailRecipient,
  opportunity: EmailOpportunity,
  signup: {
    estimatedHours: number;
    mealName: string | null;
    tshirtSize: keyof typeof tshirtSizeLabels | null;
  },
) {
  const details = opportunityDetails(opportunity);
  details.push(['Estimated hours', formatHours(signup.estimatedHours)]);
  if (signup.mealName) details.push(['Meal', signup.mealName]);
  if (signup.tshirtSize) {
    details.push(['T-shirt', tshirtSizeLabels[signup.tshirtSize]]);
  }

  return renderEmail({
    to: recipient.email,
    subject: `You're signed up: ${opportunity.title}`,
    recipient,
    paragraphs: ["Thanks for signing up! Here's what you signed up for."],
    details,
    action: mySignups,
  });
}

export function signupCancelledEmail(
  recipient: EmailRecipient,
  opportunity: EmailOpportunity,
) {
  return renderEmail({
    to: recipient.email,
    subject: `Signup cancelled: ${opportunity.title}`,
    recipient,
    paragraphs: [
      "You've cancelled your signup, and your spot has opened up for someone else.",
    ],
    details: opportunityDetails(opportunity),
    action: { label: 'Find another opportunity', path: '/opportunities' },
  });
}

export function signupRemovedEmail(
  recipient: EmailRecipient,
  opportunity: EmailOpportunity,
) {
  return renderEmail({
    to: recipient.email,
    subject: `You've been removed from ${opportunity.title}`,
    recipient,
    paragraphs: [
      'A program admin removed your signup for this opportunity. If you think this was a mistake, reach out to the organizer.',
    ],
    details: opportunityDetails(opportunity),
    action: mySignups,
  });
}

export function hoursUpdatedEmail(
  recipient: EmailRecipient,
  opportunity: EmailOpportunity,
  signup: { workCompleted: boolean; hours: number },
) {
  const details = opportunityDetails(opportunity);
  details.push([
    'Status',
    signup.workCompleted
      ? `Completed, ${formatHours(signup.hours)}`
      : 'Not marked completed',
  ]);

  return renderEmail({
    to: recipient.email,
    subject: `Your hours were updated: ${opportunity.title}`,
    recipient,
    paragraphs: ['A program admin updated your volunteer record.'],
    details,
    action: mySignups,
  });
}

export function opportunityCancelledEmail(
  recipient: EmailRecipient,
  opportunity: EmailOpportunity,
) {
  return renderEmail({
    to: recipient.email,
    subject: `Cancelled: ${opportunity.title}`,
    recipient,
    paragraphs: [
      "This opportunity has been cancelled, so you don't need to attend. Thank you for signing up.",
    ],
    details: opportunityDetails(opportunity),
    action: { label: 'Find another opportunity', path: '/opportunities' },
  });
}

export function opportunityChangedEmail(
  recipient: EmailRecipient,
  opportunity: EmailOpportunity,
) {
  return renderEmail({
    to: recipient.email,
    subject: `Updated details: ${opportunity.title}`,
    recipient,
    paragraphs: [
      "The time or place for an opportunity you're signed up for has changed. Here are the new details.",
    ],
    details: opportunityDetails(opportunity),
    action: {
      label: 'View opportunity',
      path: `/opportunities/view/${opportunity.id}`,
    },
  });
}
