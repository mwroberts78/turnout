import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  server: {
    DATABASE_URL: z.url(),
    WEBHOOK_SERVICE_DATABASE_URL: z.url(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET: z.string(),
    PLATFORM_ADMIN_ORG_ID: z.string(),
    RESEND_API_KEY: z.string(),
    BLOB_READ_WRITE_TOKEN: z.string(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    WEBHOOK_SERVICE_DATABASE_URL: process.env.WEBHOOK_SERVICE_DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    PLATFORM_ADMIN_ORG_ID: process.env.PLATFORM_ADMIN_ORG_ID,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
});
