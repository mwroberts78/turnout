import type { WebhookHandlerResult } from '../webhooks/clerk/types';

export function toWebhookResponse(result: WebhookHandlerResult) {
  if (!result.ok) {
    const status = result.reason === 'invalid_payload' ? 400 : 500;
    return new Response(result.reason, { status });
  }
  return new Response('OK', { status: 200 });
}
