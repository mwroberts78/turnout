import { sql } from 'drizzle-orm';
import { db } from '@/db';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
    );
    return callback(tx);
  });
}
