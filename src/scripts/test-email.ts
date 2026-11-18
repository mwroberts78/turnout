// Sends one of every notification email to the given address so the real
// rendering can be checked in an inbox:
//   pnpm email:samples -- you@example.com
import { sendEmail } from '@/lib/email/send';
import {
  hoursUpdatedEmail,
  opportunityCancelledEmail,
  opportunityChangedEmail,
  signupCancelledEmail,
  signupConfirmedEmail,
  signupRemovedEmail,
} from '@/lib/email/templates';

const to = process.argv.slice(2).find((arg) => arg !== '--');

if (!to) {
  console.error('Usage: pnpm email:samples -- you@example.com');
  process.exit(1);
}

const recipient = { email: to, firstName: 'Sample' };
const start = new Date();
start.setDate(start.getDate() + 7);
start.setUTCHours(15, 0, 0, 0);

const opportunity = {
  id: '00000000-0000-4000-8000-000000000000',
  title: 'Riverside Park Cleanup',
  startTime: start,
  endTime: new Date(start.getTime() + 2 * 60 * 60 * 1000),
  timeZone: 'America/New_York',
  location: '123 Main St, Anytown',
};

const samples = [
  signupConfirmedEmail(recipient, opportunity, {
    estimatedHours: 2,
    mealName: 'Veggie wrap',
    tshirtSize: 'md',
  }),
  signupCancelledEmail(recipient, opportunity),
  signupRemovedEmail(recipient, opportunity),
  hoursUpdatedEmail(recipient, opportunity, {
    workCompleted: true,
    hours: 2.5,
  }),
  opportunityCancelledEmail(recipient, opportunity),
  opportunityChangedEmail(recipient, { ...opportunity, location: null }),
];

async function main() {
  for (const message of samples) {
    await sendEmail(message);
    console.log(`Sent: ${message.subject}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
