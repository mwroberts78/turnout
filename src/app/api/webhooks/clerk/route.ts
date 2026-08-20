import { Webhook } from 'svix';
import { env } from '@/env';
import { reportError } from '@/lib/utils/reportError';
import { toWebhookResponse } from '@/lib/utils/toWebhookResponse';
import { handleOrganizationCreated } from '@/lib/webhooks/clerk/organization-created';
import { handleOrganizationDeleted } from '@/lib/webhooks/clerk/organization-deleted';
import { handleOrganizationUpdated } from '@/lib/webhooks/clerk/organization-updated';
import { handleOrganizationMembershipCreated } from '@/lib/webhooks/clerk/organizationMembership-created';
import { handleOrganizationMembershipDeleted } from '@/lib/webhooks/clerk/organizationMembership-deleted';
import { handleOrganizationMembershipUpdated } from '@/lib/webhooks/clerk/organizationMembership-updated';
import type {
  RawClerkOrgDeleteEvent,
  RawClerkOrgEvent,
  RawClerkOrgMembershipEvent,
  RawClerkUserDeleteEvent,
  RawClerkUserEvent,
} from '@/lib/webhooks/clerk/types';
import { handleUserDeleted } from '@/lib/webhooks/clerk/user-deleted';
import { handleUserUpdated } from '@/lib/webhooks/clerk/user-updated';

export async function POST(req: Request) {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let rawEvent:
    | RawClerkOrgEvent
    | RawClerkOrgMembershipEvent
    | RawClerkUserEvent
    | RawClerkOrgDeleteEvent
    | RawClerkUserDeleteEvent;
  try {
    rawEvent = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as
      | RawClerkOrgEvent
      | RawClerkOrgMembershipEvent
      | RawClerkUserEvent
      | RawClerkOrgDeleteEvent
      | RawClerkUserDeleteEvent;
  } catch (err) {
    reportError(err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (rawEvent.type === 'organization.created') {
    const result = await handleOrganizationCreated(
      rawEvent as RawClerkOrgEvent,
    );

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'organization.updated') {
    const result = await handleOrganizationUpdated(
      rawEvent as RawClerkOrgEvent,
    );

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'organization.deleted') {
    const result = await handleOrganizationDeleted(
      rawEvent as RawClerkOrgDeleteEvent,
    );

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'organizationMembership.created') {
    const result = await handleOrganizationMembershipCreated(
      rawEvent as RawClerkOrgMembershipEvent,
    );

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'organizationMembership.updated') {
    const result = await handleOrganizationMembershipUpdated(
      rawEvent as RawClerkOrgMembershipEvent,
    );

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'organizationMembership.deleted') {
    const result = await handleOrganizationMembershipDeleted(
      rawEvent as RawClerkOrgMembershipEvent,
    );

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'user.updated') {
    const result = await handleUserUpdated(rawEvent as RawClerkUserEvent);

    return toWebhookResponse(result);
  }

  if (rawEvent.type === 'user.deleted') {
    const result = await handleUserDeleted(rawEvent as RawClerkUserDeleteEvent);

    return toWebhookResponse(result);
  }

  return new Response('Ignored', { status: 200 });
}
