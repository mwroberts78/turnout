import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailDeliveryMode } from '@/lib/email/config';
import { sendEmail } from '@/lib/email/send';

const resendSend = vi.hoisted(() => vi.fn());

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend };
  },
}));

vi.mock('@/lib/email/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/email/config')>()),
  emailDeliveryMode: vi.fn(),
}));

const message = {
  to: 'avery@example.com',
  subject: 'Hello',
  html: '<p>Hi</p>',
  text: 'Hi',
};

describe('sendEmail', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('only logs in log mode', async () => {
    vi.mocked(emailDeliveryMode).mockReturnValue('log');
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    await sendEmail(message);

    expect(resendSend).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('to=avery@example.com subject="Hello"'),
    );
  });

  it('sends through Resend from the app sender', async () => {
    vi.mocked(emailDeliveryMode).mockReturnValue('resend');
    resendSend.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    await sendEmail(message);

    expect(resendSend).toHaveBeenCalledWith({
      from: 'Turnout <no-reply@mail.roberts-lab.dev>',
      ...message,
    });
  });

  it('throws when Resend reports an error', async () => {
    vi.mocked(emailDeliveryMode).mockReturnValue('resend');
    resendSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid recipient' },
    });

    await expect(sendEmail(message)).rejects.toThrow('Invalid recipient');
  });
});
