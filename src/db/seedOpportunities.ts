// src/db/seedOpportunities.ts
import { eq } from 'drizzle-orm';
import { db } from './index';
import { mealOptions, opportunities, signUps, users } from './schema/index';

const tenantId = process.argv.slice(2).find((arg) => arg !== '--');

if (!tenantId) {
  console.error('Usage: tsx src/db/seedOpportunities.ts <tenantId>');
  process.exit(1);
}

type OpportunityTemplate = {
  title: string;
  description: string | null;
  opportunityType: 'in-person' | 'virtual' | 'skills-based';
  location: string | null;
  mealProvided: boolean;
  tshirtProvided: boolean;
  maxSignupsAllowed: number | null;
  image: string;
};

const templates: OpportunityTemplate[] = [
  {
    title: 'Community park cleanup',
    description:
      "Bring gloves and good energy — we'll tackle litter, weeds, and overgrown flower beds together.",
    opportunityType: 'in-person',
    location: '123 Main St, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 3,
    image: 'outdoor-cleanup',
  },
  {
    title: 'Virtual resume-writing workshop for job seekers',
    description: null,
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'Pro-bono website audit for a local nonprofit',
    description:
      "We'll review site structure, accessibility, and basic SEO for a local nonprofit's website, then compile a short list of recommended fixes they can act on immediately.",
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 2,
    image: 'skills-consulting',
  },
  {
    title: 'Food bank sorting and packing',
    description: null,
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 10,
    image: 'donation-sorting',
  },
  {
    title: 'Habitat for Humanity build day',
    description:
      "Join a full day on an active build site, working alongside Habitat staff and the future homeowner. No experience necessary — training is provided on-site for framing, siding, and interior finishing tasks. Closed-toe shoes required.\n\nLunch and water will be provided throughout the day.",
    opportunityType: 'in-person',
    location: '789 Elm St, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 15,
    image: 'house-build',
  },
  {
    title: 'Virtual coding mentorship for teens',
    description:
      'One-hour video sessions pairing you with a local teen interested in learning to code.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'Beach cleanup and conservation walk',
    description: null,
    opportunityType: 'in-person',
    location: 'Sunset Beach, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 20,
    image: 'outdoor-cleanup',
  },
  {
    title: 'Nonprofit financial literacy webinar',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'Animal shelter dog walking day',
    description:
      'Get some fresh air with a shelter dog who could really use a break from the kennel.',
    opportunityType: 'in-person',
    location: 'Anytown Animal Shelter',
    mealProvided: false,
    tshirtProvided: true,
    maxSignupsAllowed: 8,
    image: 'animal-shelter',
  },
  {
    title: 'Senior center technology help desk',
    description:
      "Sit one-on-one with seniors to help with smartphones, video calls, email, and anything else that's been giving them trouble. Patience is the only real requirement.",
    opportunityType: 'in-person',
    location: 'Anytown Senior Center',
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 6,
    image: 'senior-support',
  },
  {
    title: 'River restoration and invasive species removal',
    description: null,
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 12,
    image: 'outdoor-cleanup',
  },
  {
    title: 'Virtual grant-writing workshop for nonprofits',
    description:
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'School supply drive packing event',
    description:
      'Assemble backpacks with school supplies for kids heading back to class.',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 15,
    image: 'donation-sorting',
  },
  {
    title: 'Pro-bono legal aid clinic',
    description:
      'Volunteer attorneys will provide free 30-minute consultations to community members on a walk-in basis, covering areas like housing, family law, and small claims. This is not a substitute for full representation, but many attendees just need direction on next steps.\n\nA basic understanding of the relevant practice area is helpful but not required — resource materials will be provided.',
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 3,
    image: 'skills-consulting',
  },
  {
    title: 'Community garden planting day',
    description: null,
    opportunityType: 'in-person',
    location: 'Maple Street Community Garden',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 10,
    image: 'community-garden',
  },
  {
    title: 'Virtual mock interview coaching',
    description:
      'Run through a full mock interview with a job seeker, then spend 15 minutes giving direct, constructive feedback on their answers and presentation.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'Blood drive volunteer support',
    description:
      'Help greet, check in, and guide donors through the process — no medical experience needed.',
    opportunityType: 'in-person',
    location: 'Anytown Community Center',
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 25,
    image: 'blood-drive',
  },
  {
    title: 'Trail maintenance and signage repair',
    description: null,
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 12,
    image: 'outdoor-cleanup',
  },
  {
    title: 'Nonprofit board matching info session',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'Meals on Wheels delivery route',
    description:
      'Deliver a set route of hot meals to homebound seniors in your assigned area.',
    opportunityType: 'in-person',
    location: 'Anytown Senior Center',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 8,
    image: 'senior-support',
  },
  {
    title: 'Data analysis for a local nonprofit',
    description: null,
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 2,
    image: 'skills-consulting',
  },
  {
    title: 'Holiday toy drive sorting',
    description:
      'Sort, label, and box donated toys by age group ahead of the holiday distribution event. Expect to be on your feet most of the shift.',
    opportunityType: 'in-person',
    location: '456 Oak Ave, Anytown, USA',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 20,
    image: 'donation-sorting',
  },
  {
    title: 'Virtual English conversation practice for immigrants',
    description:
      'Spend 45 minutes in casual conversation with an adult English-language learner.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
  {
    title: 'Tree planting and habitat restoration day',
    description:
      "We're restoring a section of native habitat along the river corridor that was damaged by last year's flooding. Volunteers will plant saplings, install protective tree guards, and clear invasive growth from the planting area.\n\nWear clothes you don't mind getting muddy — this one gets hands-on fast.",
    opportunityType: 'in-person',
    location: 'Willow River Trailhead',
    mealProvided: true,
    tshirtProvided: true,
    maxSignupsAllowed: 15,
    image: 'outdoor-cleanup',
  },
  {
    title: 'Nonprofit marketing and branding consultation',
    description: null,
    opportunityType: 'skills-based',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: 3,
    image: 'skills-consulting',
  },
  {
    title: 'Homeless shelter meal service',
    description:
      "Prep, serve, and clean up after a hot dinner service for shelter guests. Kitchen experience is helpful but not required — you'll be paired with a regular volunteer.",
    opportunityType: 'in-person',
    location: 'Anytown Community Shelter',
    mealProvided: true,
    tshirtProvided: false,
    maxSignupsAllowed: 10,
    image: 'meal-service',
  },
  {
    title: 'Virtual portfolio review for design students',
    description:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    opportunityType: 'virtual',
    location: null,
    mealProvided: false,
    tshirtProvided: false,
    maxSignupsAllowed: null,
    image: 'virtual-session',
  },
];

const opportunityData = templates.map((template, index) => {
  const startTime = new Date('2026-09-01T09:00:00-04:00');
  startTime.setDate(startTime.getDate() + index * 3);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 4);

  return {
    ...template,
    imageUrl: `/seed-images/${template.image}.jpg`,
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
  title: string,
  index: number,
  maxSignupsAllowed: number | null,
  volunteerCount: number,
): number {
  if (title === 'Community park cleanup') return 3; // exactly maxed out
  if (title === 'Food bank sorting and packing') return 2; // partially filled
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

    console.log(`Created opportunity: ${inserted.title}`);

    const signupCount = signupCountForOpportunity(
      opp.title,
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
        `  ↳ ${signupCount} signup(s) for "${inserted.title}"`,
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
