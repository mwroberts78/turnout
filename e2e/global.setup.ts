import { clerkSetup } from '@clerk/testing/playwright';
import { closeDb, removeE2EData } from './support/db';

export default async function globalSetup() {
  // Fetches a Clerk testing token so sign-in skips bot protection. Refuses to
  // run against a production Clerk instance.
  await clerkSetup();
  // Clear anything an interrupted earlier run left behind.
  await removeE2EData();
  await closeDb();
}
