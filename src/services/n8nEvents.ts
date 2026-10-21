// The site has no backend: orders and contact inquiries go straight to the n8n
// "Order Events Webhook" (n8n/Morrow & Bean — Chatbot & Orders.json).
// Webhook URLs are public; n8n re-checks prices and validates every event.
export const N8N_EVENTS_URL = (import.meta.env.VITE_N8N_EVENTS_URL as string | undefined)?.trim() ?? '';

export type CafeEvent = 'order.created' | 'inquiry.created';

export function createReference(prefix: string, date = new Date()): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(16).slice(2).padEnd(12, '0');
  return `${prefix}-${date.toISOString().slice(0, 10).replaceAll('-', '')}-${random.slice(0, 6).toUpperCase()}`;
}

/** Posts one business event to n8n. Resolves only when n8n accepted it (2xx). */
export async function sendEvent(url: string, event: CafeEvent, data: unknown): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ event, occurredAt: new Date().toISOString(), source: 'morrow-bean-website', data }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}
