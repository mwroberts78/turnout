import { relations } from 'drizzle-orm';
import { mealOptions } from './meal-options';
import { opportunities } from './opportunities';
import { projects } from './projects';
import { signUps } from './signups';
import { users } from './users';

export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    signUps: many(signUps),
    mealOptions: many(mealOptions),
    project: one(projects, {
      fields: [opportunities.projectId],
      references: [projects.id],
    }),
    creator: one(users, {
      fields: [opportunities.createdBy],
      references: [users.id],
      relationName: 'opportunityCreator',
    }),
    updater: one(users, {
      fields: [opportunities.updatedBy],
      references: [users.id],
      relationName: 'opportunityUpdater',
    }),
  }),
);

export const signUpsRelations = relations(signUps, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [signUps.opportunityId],
    references: [opportunities.id],
  }),
  user: one(users, { fields: [signUps.userId], references: [users.id] }),
  selectedMealOption: one(mealOptions, {
    fields: [signUps.selectedMeal],
    references: [mealOptions.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  signUps: many(signUps),
}));

export const mealOptionsRelations = relations(mealOptions, ({ one, many }) => ({
  opportunity: one(opportunities, {
    fields: [mealOptions.opportunityId],
    references: [opportunities.id],
  }),
  signUps: many(signUps),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  opportunities: many(opportunities),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'projectCreator',
  }),
  updater: one(users, {
    fields: [projects.updatedBy],
    references: [users.id],
    relationName: 'projectUpdater',
  }),
}));
