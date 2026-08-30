// src/db/seedOpportunities.ts
import { eq } from 'drizzle-orm';
import { db } from './index';
import { mealOptions, opportunities, signUps, users } from './schema/index';

const tenantId = process.argv.slice(2).find((arg) => arg !== '--');

if (!tenantId) {
  console.error('Usage: tsx src/db/seedOpportunities.ts <tenantId>');
  process.exit(1);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type OpportunityTemplate = {
  description: string;
  opportunityType: 'in-person' | 'virtual' | 'skills-based';
  location: string | null;
  mealProvided: boolean;
  tshirtProvided: boolean;
  maxSignupsAllowed: number | null;
};

const templates: OpportunityTemplate[] = [
  {
    description: 'Community park cleanup',
    opportunityType: 'in-person',
    location: '123 Main St, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 3,
  },
  {
    description: 'Virtual resume-writing workshop for job seekers',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'Pro-bono website audit for a local nonprofit',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 2,
  },
  {
    description: 'Food bank sorting and packing',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 10,
  },
  {
    description: 'Habitat for Humanity build day',
    opportunityType: 'in-person',
    location: '789 Elm St, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 15,
  },
  {
    description: 'Virtual coding mentorship for teens',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'Beach cleanup and conservation walk',
    opportunityType: 'in-person',
    location: 'Sunset Beach, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 20,
  },
  {
    description: 'Nonprofit financial literacy webinar',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'Animal shelter dog walking day',
    opportunityType: 'in-person',
    location: 'Anytown Animal Shelter',
    mealProvided: false,
    tshirtProvided: true,
    maxSignupsAllowed: 8,
  },
  {
    description: 'Senior center technology help desk',
    opportunityType: 'in-person',
    location: 'Anytown Senior Center',
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 6,
  },
  {
    description: 'River restoration and invasive species removal',
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 12,
  },
  {
    description: 'Virtual grant-writing workshop for nonprofits',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'School supply drive packing event',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 15,
  },
  {
    description: 'Pro-bono legal aid clinic',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 3,
  },
  {
    description: 'Community garden planting day',
    opportunityType: 'in-person',
    location: 'Maple Street Community Garden',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 10,
  },
  {
    description: 'Virtual mock interview coaching',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'Blood drive volunteer support',
    opportunityType: 'in-person',
    location: 'Anytown Community Center',
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 25,
  },
  {
    description: 'Trail maintenance and signage repair',
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 12,
  },
  {
    description: 'Nonprofit board matching info session',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'Meals on Wheels delivery route',
    opportunityType: 'in-person',
    location: 'Anytown Senior Center',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 8,
  },
  {
    description: 'Data analysis for a local nonprofit',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 2,
  },
  {
    description: 'Holiday toy drive sorting',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 20,
  },
  {
    description: 'Virtual English conversation practice for immigrants',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
  {
    description: 'Tree planting and habitat restoration day',
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 15,
  },
  {
    description: 'Nonprofit marketing and branding consultation',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 3,
  },
  {
    description: 'Homeless shelter meal service',
    opportunityType: 'in-person',
    location: 'Anytown Community Shelter',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 10,
  },
  {
    description: 'Virtual portfolio review for design students',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
  },
];

const opportunityData = templates.map((template, index) => {
  const startTime = new Date('2026-09-01T09:00:00-04:00');
  startTime.setDate(startTime.getDate() + index * 3);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 4);

  return {
    ...template,
    imageUrl: `https://picsum.photos/seed/${slugify(template.description)}/800/600`,
    startTime,
    endTime,
  };
});

const fakeVolunteers = [
  { firstName: 'Jordan', lastName: 'Alvarez', email: 'jordan.alvarez@example.com' },
  { firstName: 'Casey', lastName: 'Nguyen', email: 'casey.nguyen@example.com' },
  { firstName: 'Morgan', lastName: 'Patel', email: 'morgan.patel@example.com' },
  { firstName: 'Riley', lastName: 'Thompson', email: 'riley.thompson@example.com' },
  { firstName: 'Taylor', lastName: 'Brooks', email: 'taylor.brooks@example.com' },
  { firstName: 'Avery', lastName: 'Kim', email: 'avery.kim@example.com' },
  { firstName: 'Sam', lastName: 'Rodriguez', email: 'sam.rodriguez@example.com' },
  { firstName: 'Drew', lastName: 'Bennett', email: 'drew.bennett@example.com' },
];

const tshirtSizes = ['sm', 'md', 'lg', 'xl'] as const;

function signupCountForOpportunity(
  description: string,
  index: number,
  maxSignupsAllowed: number | null,
  volunteerCount: number,
): number {
  if (description === 'Community park cleanup') return 3; // exactly maxed out
  if (description === 'Food bank sorting and packing') return 2; // partially filled
  if (index % 4 === 0) return 0; // leave some opportunities with no signups at all

  const desired = (index % 3) + 1; // 1, 2, or 3
  return Math.min(desired, maxSignupsAllowed ?? volunteerCount, volunteerCount);
}

const seedOpportunities = async () => {
  const tenantUsers = await db.query.users.findMany({
    where: eq(users.tenantId, tenantId),
  });

  const creator = tenantUsers.find((u) => u.role === 'admin') ?? tenantUsers[0];

  if (!creator) {
    console.error(
      `No users found for tenant ${tenantId}. Create a user first.`,
    );
    process.exit(1);
  }

  const volunteers = await db
    .insert(users)
    .values(
      fakeVolunteers.map((volunteer, index) => ({
        tenantId,
        clerkUserId: `user_fake_volunteer_${index + 1}`,
        email: volunteer.email,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        role: 'employee' as const,
      })),
    )
    .returning();

  console.log(`Created ${volunteers.length} fake volunteer users.`);

  for (let index = 0; index < opportunityData.length; index++) {
    const opp = opportunityData[index];
    const [inserted] = await db
      .insert(opportunities)
      .values({ tenantId, createdBy: creator.id, ...opp })
      .returning();

    let meals: { id: string }[] = [];
    if (opp.mealProvided) {
      meals = await db
        .insert(mealOptions)
        .values([
          {
            tenantId,
            opportunityId: inserted.id,
            mealName: 'Standard',
            createdBy: creator.id,
          },
          {
            tenantId,
            opportunityId: inserted.id,
            mealName: 'Vegetarian',
            createdBy: creator.id,
          },
        ])
        .returning();
    }

    console.log(`Created opportunity: ${inserted.description}`);

    const signupCount = signupCountForOpportunity(
      opp.description,
      index,
      opp.maxSignupsAllowed,
      volunteers.length,
    );

    if (signupCount > 0) {
      await db.insert(signUps).values(
        Array.from({ length: signupCount }, (_, i) => {
          const volunteer = volunteers[(index + i) % volunteers.length];
          return {
            tenantId,
            userId: volunteer.id,
            opportunityId: inserted.id,
            estimatedHours: 4,
            wantsMeal: opp.mealProvided,
            selectedMeal: opp.mealProvided
              ? meals[i % meals.length]?.id
              : undefined,
            wantsTShirt: opp.tshirtProvided,
            tshirtSize: opp.tshirtProvided
              ? tshirtSizes[i % tshirtSizes.length]
              : undefined,
            createdBy: volunteer.id,
          };
        }),
      );
      console.log(
        `  ↳ ${signupCount} signup(s) for "${inserted.description}"`,
      );
    }
  }

  console.log(
    `Seed complete — ${opportunityData.length} opportunities created.`,
  );
  process.exit(0);
};

seedOpportunities().catch((err) => {
  console.error(err);
  process.exit(1);
});
