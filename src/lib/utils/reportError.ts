import * as Sentry from '@sentry/nextjs';

export const reportError = (
  err: unknown,
  context?: Record<string, unknown>,
) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err, { extra: context });
  } else {
    console.error(err, context);
  }
};
