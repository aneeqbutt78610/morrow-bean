// Public URL of the n8n "Website Chat" trigger (n8n/morrow-bean-workflow.json), e.g.
// http://localhost:5678/webhook/<webhookId>/chat. Chat-trigger URLs are public by design.
export const CHAT_URL = (import.meta.env.VITE_N8N_CHAT_URL as string | undefined)?.trim() ?? '';

/** Sends one message to the n8n chat trigger and returns the agent's reply. Throws on any failure. */
export async function askAgent(chatUrl: string, sessionId: string, chatInput: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput, metadata: { inputMode: 'text' } }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw: unknown = await response.json();
    const data = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | undefined;
    const reply = [data?.output, data?.text, data?.reply, data?.message].find((value): value is string => typeof value === 'string' && value.trim() !== '');
    if (!reply) throw new Error('The chat agent returned an empty reply.');
    return reply.trim();
  } finally {
    clearTimeout(timeout);
  }
}
