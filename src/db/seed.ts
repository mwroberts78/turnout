// src/db/seed.ts
import { db } from './index';
import {
  mealOptions,
  opportunities,
  signUps,
  tenants,
  users,
} from './schema/index';

async function seed() {
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Test Org',
      clerkOrgId: 'org_3HN2oWAXPQiFBJdxG9BduWD08U2',
      tier: 'free',
    })
    .returning();

  const [employee] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      clerkUserId: 'user_fake_employee_1',
      email: 'jane.doe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'employee',
    })
    .returning();

  const [opportunity] = await db
    .insert(opportunities)
    .values({
      tenantId: tenant.id,
      description: 'Community park cleanup',
      opportunityType: 'in-person',
      location: '123 Main St, Anytown, USA',
      startTime: new Date('2026-09-01T09:00:00-04:00'),
      endTime: new Date('2026-09-01T13:00:00-04:00'),
      mealProvided: true,
      tshirtProvided: true,
      createdBy: employee.id,
    })
    .returning();

  const meals = await db
    .insert(mealOptions)
    .values([
      {
        tenantId: tenant.id,
        opportunityId: opportunity.id,
        mealName: 'Vegetarian',
        createdBy: employee.id,
      },
      {
        tenantId: tenant.id,
        opportunityId: opportunity.id,
        mealName: 'Vegan',
        createdBy: employee.id,
      },
      {
        tenantId: tenant.id,
        opportunityId: opportunity.id,
        mealName: 'Standard',
        createdBy: employee.id,
      },
    ])
    .returning();

  await db.insert(signUps).values({
    tenantId: tenant.id,
    userId: employee.id,
    opportunityId: opportunity.id,
    comments: 'Looking forward to it!',
    estimatedHours: 4,
    wantsMeal: true,
    selectedMeal: meals[0].id,
    wantsTShirt: true,
    tshirtSize: 'lg',
    createdBy: employee.id,
  });

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
