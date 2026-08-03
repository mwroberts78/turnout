import { Resend } from 'resend';
import { env } from '@/env';

const resend = new Resend(env.RESEND_API_KEY);

async function main() {
  const result = await resend.emails.send({
    from: 'no-reply@mail.roberts-lab.dev',
    to: 'matt.w.roberts78@gmail.com',
    subject: 'Turnout - Test Email',
    html: '<p>If you got this, Resend is wired correctly.</p>',
  });

  console.log(result);
}

main();
