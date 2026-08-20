import type { db } from '@/db';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbClient = typeof db | Tx;
