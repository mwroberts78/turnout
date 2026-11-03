import { vi } from 'vitest';

vi.mock('@/lib/utils/mockDelay', () => ({
  mockDelay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({
  del: vi.fn().mockResolvedValue(undefined),
}));
