import { sql } from 'drizzle-orm';
import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';
import {
  type AnyPgColumn,
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const opportunityTypeEnum = pgEnum('opportunity_type', [
  'in-person',
  'virtual',
  'skills-based',
]);

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    title: text('title').notNull(),
    description: text('description'),
    opportunityType: opportunityTypeEnum('opportunity_type')
      .default('in-person')
      .notNull(),
    location: text('location'),
    imageUrl: text('image_url'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    mealProvided: boolean('meal_provided').default(false).notNull(),
    tshirtProvided: boolean('tshirt_provided').default(false).notNull(),
    maxSignupsAllowed: integer('max_signups_allowed'),
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

export type Opportunity = typeof opportunities.$inferSelect;
