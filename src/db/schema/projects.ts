import { sql } from 'drizzle-orm';
import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';
import {
  type AnyPgColumn,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

// A project groups related opportunities (for example, a week of service
// events) so employees can browse them together.
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    title: text('title').notNull(),
    description: text('description'),
    isPublished: boolean('is_published').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by')
      .notNull()
      .references((): AnyPgColumn => users.id),
    updatedBy: uuid('updated_by').references((): AnyPgColumn => users.id),
    deletedBy: uuid('deleted_by').references((): AnyPgColumn => users.id),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: sql`${table.tenantId} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`,
      modify: sql`${table.tenantId} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`,
    }),
  ],
);

export type Project = typeof projects.$inferSelect;
