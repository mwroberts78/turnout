import { Resend } from 'resend';
import { env } from '@/env';
import { emailDeliveryMode, emailFrom } from './config';
import type { EmailMessage } from './templates';

let resend: Resend | undefined;

export async function sendEmail(message: EmailMessage) {
  if (emailDeliveryMode() === 'log') {
    console.info(
      `[email] to=${message.to} subject="${message.subject}"\n${message.text}`,
    );
    return;
  }

  resend ??= new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  if (error) {
    throw new Error(
      `Resend failed to send "${message.subject}": ${error.message}`,
    );
  }
}
