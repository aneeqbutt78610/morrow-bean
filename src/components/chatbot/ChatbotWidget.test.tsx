import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import ChatbotWidget from './ChatbotWidget';

const CHAT_URL = 'https://n8n.example/webhook/abc/chat';

describe('ChatbotWidget', () => {
  // jsdom has no scrolling; the transcript auto-scroll only needs the method to exist.
  beforeAll(() => { Element.prototype.scrollTo = () => {}; });

  it('sends the message to the n8n chat trigger and shows the agent reply', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: 'The Spanish Latte is PKR 720.' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ChatbotWidget chatUrl={CHAT_URL} />);

    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    await user.type(screen.getByLabelText('Your message'), 'How much is a Spanish Latte?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('The Spanish Latte is PKR 720.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe(CHAT_URL);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ action: 'sendMessage', chatInput: 'How much is a Spanish Latte?' });
  });

  it('shows an honest error instead of a fake reply when n8n fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 500 })));
    const user = userEvent.setup();
    render(<ChatbotWidget chatUrl={CHAT_URL} />);

    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    await user.type(screen.getByLabelText('Your message'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable');
  });

  it('stays disabled with a setup hint when no chat URL is configured', async () => {
    const user = userEvent.setup();
    render(<ChatbotWidget chatUrl="" />);
    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    expect(screen.getByLabelText('Your message')).toBeDisabled();
    expect(screen.getByText(/VITE_N8N_CHAT_URL/)).toBeInTheDocument();
  });
});
