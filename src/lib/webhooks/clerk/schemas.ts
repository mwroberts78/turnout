import { z } from 'zod';

export const clerkWebhookOrgSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const clerkWebhookOrgMembership = z.object({
  type: z.string(),
  data: z.object({
    organization: z.object({
      id: z.string(),
    }),
    role: z.string(),
    public_user_data: z.object({
      first_name: z.string(),
      last_name: z.string(),
      identifier: z.string(),
      user_id: z.string(),
    }),
  }),
});

export const clerkWebhookUser = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    primary_email_address_id: z.string(),
    email_addresses: z.array(
      z.object({
        email_address: z.string(),
        id: z.string(),
      }),
    ),
  }),
});

export const clerkWebhookUserDelete = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
  }),
});

export const clerkWebhookOrgDelete = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
  }),
});
