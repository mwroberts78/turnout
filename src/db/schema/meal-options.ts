import { sql } from 'drizzle-orm';
import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';

import {
  type AnyPgColumn,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';
import { tenants } from './tenants';
import { users } from './users';

export const mealOptions = pgTable(
  'meal_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id),
    mealName: text('meal_name').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by')
      .notNull()
      .references((): AnyPgColumn => users.id),
    updatedBy: uuid('updated_by').references((): AnyPgColumn => users.id),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: sql`${table.tenantId} = current_setting('app.current_tenant_id')::uuid`,
      modify: sql`${table.tenantId} = current_setting('app.current_tenant_id')::uuid`,
    }),
  ],
);
