import { sql } from 'drizzle-orm';
import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const tenantTierEnum = pgEnum('tenant_tier', [
  'free',
  'pro',
  'enterprise',
]);

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    clerkOrgId: text('clerk_org_id').notNull().unique(),
    tier: tenantTierEnum('tier').notNull().default('free'),

    createdBy: uuid('created_by').references((): AnyPgColumn => users.id),
    updatedBy: uuid('updated_by').references((): AnyPgColumn => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: sql`${table.id} = current_setting('app.current_tenant_id')::uuid`,
      modify: sql`${table.id} = current_setting('app.current_tenant_id')::uuid`,
    }),
  ],
);
