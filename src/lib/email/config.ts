import { env } from '@/env';
import { APP_NAME } from '../constants/app';

export function emailDeliveryMode(): 'resend' | 'log' {
  return (
    env.EMAIL_DELIVERY ??
    (process.env.NODE_ENV === 'production' ? 'resend' : 'log')
  );
}

export function emailFrom() {
  return env.EMAIL_FROM ?? `${APP_NAME} <no-reply@mail.roberts-lab.dev>`;
}

export function appUrl() {
  return env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000';
}
