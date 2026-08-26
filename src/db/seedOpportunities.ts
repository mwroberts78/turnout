// src/db/seedOpportunities.ts
import { eq } from 'drizzle-orm';
import { db } from './index';
import { mealOptions, opportunities, users } from './schema/index';

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
};

const templates: OpportunityTemplate[] = [
  {
    description: 'Community park cleanup',
    opportunityType: 'in-person',
    location: '123 Main St, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Virtual resume-writing workshop for job seekers',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Pro-bono website audit for a local nonprofit',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Food bank sorting and packing',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
  },
  {
    description: 'Habitat for Humanity build day',
    opportunityType: 'in-person',
    location: '789 Elm St, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Virtual coding mentorship for teens',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Beach cleanup and conservation walk',
    opportunityType: 'in-person',
    location: 'Sunset Beach, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
  },
  {
    description: 'Nonprofit financial literacy webinar',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Animal shelter dog walking day',
    opportunityType: 'in-person',
    location: 'Anytown Animal Shelter',
    mealProvided: false,
    tshirtProvided: true,
  },
  {
    description: 'Senior center technology help desk',
    opportunityType: 'in-person',
    location: 'Anytown Senior Center',
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'River restoration and invasive species removal',
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Virtual grant-writing workshop for nonprofits',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'School supply drive packing event',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
  },
  {
    description: 'Pro-bono legal aid clinic',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Community garden planting day',
    opportunityType: 'in-person',
    location: 'Maple Street Community Garden',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Virtual mock interview coaching',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Blood drive volunteer support',
    opportunityType: 'in-person',
    location: 'Anytown Community Center',
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Trail maintenance and signage repair',
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Nonprofit board matching info session',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Meals on Wheels delivery route',
    opportunityType: 'in-person',
    location: 'Anytown Senior Center',
    mealProvided: true,
    tshirtProvided: false,
  },
  {
    description: 'Data analysis for a local nonprofit',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Holiday toy drive sorting',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Virtual English conversation practice for immigrants',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Tree planting and habitat restoration day',
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
  },
  {
    description: 'Nonprofit marketing and branding consultation',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
  },
  {
    description: 'Homeless shelter meal service',
    opportunityType: 'in-person',
    location: 'Anytown Community Shelter',
    mealProvided: true,
    tshirtProvided: false,
  },
  {
    description: 'Virtual portfolio review for design students',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
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

  for (const opp of opportunityData) {
    const [inserted] = await db
      .insert(opportunities)
      .values({ tenantId, createdBy: creator.id, ...opp })
      .returning();

    if (opp.mealProvided) {
      await db.insert(mealOptions).values([
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
      ]);
    }

    console.log(`Created opportunity: ${inserted.description}`);
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
