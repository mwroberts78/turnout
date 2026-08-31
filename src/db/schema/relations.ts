import { relations } from 'drizzle-orm';
import { mealOptions } from './meal-options';
import { opportunities } from './opportunities';
import { signUps } from './signups';
import { users } from './users';

export const opportunitiesRelations = relations(opportunities, ({ many }) => ({
  signUps: many(signUps),
  mealOptions: many(mealOptions),
}));

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
