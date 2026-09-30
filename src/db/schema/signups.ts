import { sql } from 'drizzle-orm';
import { authenticatedRole, crudPolicy } from 'drizzle-orm/neon';
import {
  type AnyPgColumn,
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { mealOptions } from './meal-options';
import { opportunities } from './opportunities';
import { tenants } from './tenants';
import { users } from './users';

export const tshirtSizesEnum = pgEnum('tshirt_sizes', [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2x',
  '3x',
]);

export const signUps = pgTable(
  'sign_ups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references((): AnyPgColumn => tenants.id),
    userId: uuid('user_id')
      .notNull()
      .references((): AnyPgColumn => users.id),
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references((): AnyPgColumn => opportunities.id),
    workCompleted: boolean('work_completed').default(false).notNull(),
    comments: text('comments'),
    estimatedHours: numeric('estimated_hours', { mode: 'number' }).notNull(),
    actualHours: numeric('actual_hours', { mode: 'number' }),
    wantsMeal: boolean('wants_meal').default(false).notNull(),
    selectedMeal: uuid('selected_meal').references(
      (): AnyPgColumn => mealOptions.id,
    ),
    wantsTShirt: boolean('wants_tshirt').default(false).notNull(),
    tshirtSize: tshirtSizesEnum('tshirt_size'),

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
