import { closeDb, removeE2EData } from './support/db';

export default async function globalTeardown() {
  await removeE2EData();
  await closeDb();
}
