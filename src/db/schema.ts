import { sql } from 'drizzle-orm';

import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    email: text('email').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: sql`${table.tenantId} = current_setting('app.current_tenant_id')::uuid`,
      modify: sql`${table.tenantId} = current_setting('app.current_tenant_id')::uuid`,
    }),
  ],
);
