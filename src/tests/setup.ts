import { vi } from 'vitest';

vi.mock('@/lib/utils/mockDelay', () => ({
  mockDelay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@vercel/blob', () => ({
  del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/lib/email/queue', () => ({
  queueEmails: vi.fn(),
}));
