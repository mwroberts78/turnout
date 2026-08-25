import { eq } from 'drizzle-orm';
import { type NewUser, type UpdateUser, type User, users } from '@/db/schema';
import { dbService } from '@/db/webhookServiceClient';
import type { DbClient } from './dbClient';

export async function createUser(input: NewUser, client: DbClient = dbService) {
  await client
    .insert(users)
    .values({ ...input })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        deletedAt: null,
        deletedBy: null,
        ...input,
      },
    });
}

export async function updateUser(
  userId: string,
  input: UpdateUser,
  client: DbClient = dbService,
) {
  await client
    .update(users)
    .set({ ...input })
    .where(eq(users.id, userId));
}

export async function deleteUser(
  userToDeleteId: string,
  client: DbClient = dbService,
) {
  await client
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.id, userToDeleteId));
}

export async function findUserByClerkId(
  clerkUserId: string,
  client: DbClient = dbService,
): Promise<User | undefined> {
  const result = await client.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });

  return result;
}
