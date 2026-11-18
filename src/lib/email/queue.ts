import { after } from 'next/server';
import { reportError } from '../utils/reportError';
import { sendEmail } from './send';
import type { EmailMessage } from './templates';

// Sends after the response is returned so the user never waits on email, and
// a delivery failure is reported instead of failing the action that caused it.
export function queueEmails(messages: EmailMessage[]) {
  if (messages.length === 0) return;

  after(async () => {
    for (const message of messages) {
      try {
        await sendEmail(message);
      } catch (error) {
        reportError(error, { subject: message.subject });
      }
    }
  });
}
