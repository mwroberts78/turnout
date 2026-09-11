export async function mockDelay(ms = 3000): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
