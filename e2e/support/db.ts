import { and, eq, inArray, isNull, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/db/schema';

const { mealOptions, opportunities, projects, signUps, users } = schema;

// Every row the suite creates carries this prefix so it can be found and
// removed again, even after an interrupted run.
export const E2E_PREFIX = 'E2E ';

function connectionString() {
  const url = process.env.E2E_DATABASE_URL;
  if (!url)
    throw new Error('E2E_DATABASE_URL is not set (see .env.e2e.example)');
  return url;
}

function connect() {
  const client = postgres(connectionString(), { max: 2 });
  return { client, db: drizzle(client, { schema }) };
}

let connection: ReturnType<typeof connect> | undefined;

// Opened on first use and closed by closeDb, so global setup and teardown
// (which share this module) each get a live connection.
function database() {
  connection ??= connect();
  return connection.db;
}

export function uniqueTitle(label: string) {
  return `${E2E_PREFIX}${label} ${Math.random().toString(36).slice(2, 8)}`;
}

export function daysFromNow(days: number, hour = 15) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

export async function findUser(email: string) {
  const user = await database().query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
  });

  if (!user) {
    throw new Error(
      `No local user for ${email}. Run pnpm db:sync:clerk, then check .env.e2e.`,
    );
  }

  return user;
}

export async function seedOpportunity(
  admin: { id: string; tenantId: string },
  overrides: Partial<typeof opportunities.$inferInsert> & {
    meals?: string[];
  } = {},
) {
  const { meals = [], ...values } = overrides;
  const startTime = values.startTime ?? daysFromNow(7);

  const [opportunity] = await database()
    .insert(opportunities)
    .values({
      tenantId: admin.tenantId,
      createdBy: admin.id,
      title: uniqueTitle('Opportunity'),
      opportunityType: 'virtual',
      isPublished: true,
      startTime,
      endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
      mealProvided: meals.length > 0,
      ...values,
    })
    .returning();

  if (meals.length > 0) {
    await database()
      .insert(mealOptions)
      .values(
        meals.map((mealName) => ({
          tenantId: admin.tenantId,
          opportunityId: opportunity.id,
          mealName,
          createdBy: admin.id,
        })),
      );
  }

  return opportunity;
}

export async function seedSignUp(
  user: { id: string; tenantId: string },
  opportunityId: string,
  overrides: Partial<typeof signUps.$inferInsert> = {},
) {
  const [signUp] = await database()
    .insert(signUps)
    .values({
      tenantId: user.tenantId,
      userId: user.id,
      opportunityId,
      estimatedHours: 2,
      createdBy: user.id,
      ...overrides,
    })
    .returning();

  return signUp;
}

export async function findSignUp(userId: string, opportunityId: string) {
  return database().query.signUps.findFirst({
    where: and(
      eq(signUps.userId, userId),
      eq(signUps.opportunityId, opportunityId),
      isNull(signUps.deletedAt),
    ),
  });
}

export async function removeE2EData() {
  const e2eOpportunities = await database()
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(like(opportunities.title, `${E2E_PREFIX}%`));
  const ids = e2eOpportunities.map((o) => o.id);

  if (ids.length > 0) {
    await database().delete(signUps).where(inArray(signUps.opportunityId, ids));
    await database()
      .delete(mealOptions)
      .where(inArray(mealOptions.opportunityId, ids));
    await database()
      .delete(opportunities)
      .where(inArray(opportunities.id, ids));
  }

  const e2eProjects = await database()
    .select({ id: projects.id })
    .from(projects)
    .where(like(projects.title, `${E2E_PREFIX}%`));
  const projectIds = e2eProjects.map((p) => p.id);

  if (projectIds.length > 0) {
    await database()
      .update(opportunities)
      .set({ projectId: null })
      .where(inArray(opportunities.projectId, projectIds));
    await database().delete(projects).where(inArray(projects.id, projectIds));
  }
}

export async function closeDb() {
  await connection?.client.end();
  connection = undefined;
}
