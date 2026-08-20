import { sql } from 'drizzle-orm';
import { db } from '../db/index';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

class RollbackSignal extends Error {
  constructor(public readonly result: unknown) {
    super('rollback');
  }
}

export async function asTenant<T>(
  tenantId: string,
  callback: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE authenticated`);
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
    );

    return callback(tx);
  });
}

export async function asWebhookService<T>(
  callback: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE webhook_service`);

    return callback(tx);
  });
}

export async function withRollback<T>(
  callback: (
    tx: Tx,
    actAs: (tenantId: string) => Promise<void>,
    actAsWebhookService: () => Promise<void>,
  ) => Promise<T>,
): Promise<T> {
  try {
    await db.transaction(async (tx) => {
      const actAs = async (tenantId: string) => {
        await tx.execute(sql`SET LOCAL ROLE authenticated`);
        await tx.execute(
          sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
        );
      };

      const actAsWebhookService = async () => {
        await tx.execute(sql`SET LOCAL ROLE webhook_service`);
      };

      const result = await callback(tx, actAs, actAsWebhookService);
      throw new RollbackSignal(result);
    });
    throw new Error('Expected transaction to roll back');
  } catch (err) {
    if (err instanceof RollbackSignal) return err.result as T;
    throw err;
  }
}
