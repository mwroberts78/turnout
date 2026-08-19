import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env';
import * as schema from './schema';

const client = postgres(env.WEBHOOK_SERVICE_DATABASE_URL);
export const dbService = drizzle(client, { schema });
