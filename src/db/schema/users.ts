import { sql } from 'drizzle-orm';

import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';
import {
  type AnyPgColumn,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const userRoleEnum = pgEnum('user_role', ['admin', 'employee']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    email: text('email').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    role: userRoleEnum('role').notNull().default('employee'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    updatedBy: uuid('updated_by').references((): AnyPgColumn => users.id),
    deletedAt: timestamp('deleted_at'),
    deletedBy: uuid('deleted_by').references((): AnyPgColumn => users.id),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: sql`${table.tenantId} = current_setting('app.current_tenant_id', true)::uuid AND ${table.deletedAt} IS NULL`,
      modify: sql`${table.tenantId} = current_setting('app.current_tenant_id', true)::uuid`,
    }),
    pgPolicy('self-lookup-by-clerk-user-id', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.clerkUserId} = current_setting('app.current_clerk_user_id', true) AND ${table.deletedAt} IS NULL`,
    }),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<
  Pick<NewUser, 'firstName' | 'lastName' | 'email' | 'phone' | 'role'>
>;
