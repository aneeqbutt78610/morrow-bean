import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import ChatbotWidget from './ChatbotWidget';
import { OrderProvider } from '../order/OrderProvider';
import { findMentionedItems } from '../../services/chatMenuCards';
import { toSpeakable } from '../../services/voice';

const CHAT_URL = 'https://n8n.example/webhook/abc/chat';
const future = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

function renderWidget(chatUrl = CHAT_URL) {
  return render(<OrderProvider><MemoryRouter future={future}><ChatbotWidget chatUrl={chatUrl} /></MemoryRouter></OrderProvider>);
}

const reply = (output: string) => vi.fn().mockResolvedValue(new Response(JSON.stringify({ output }), { status: 200 }));

// Minimal fake of the browser's speech recognition: say() delivers one final transcript.
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = ''; interimResults = false; continuous = false; maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() { FakeRecognition.last = this; }
  start() {}
  stop() { this.onend?.(); }
  abort() { this.onend?.(); }
  say(text: string) {
    const result = Object.assign([{ transcript: text }], { isFinal: true });
    this.onresult?.({ resultIndex: 0, results: [result] });
    this.onend?.();
  }
}

describe('ChatbotWidget', () => {
  // jsdom has no scrolling; the transcript auto-scroll only needs the method to exist.
  beforeAll(() => { Element.prototype.scrollTo = () => {}; });
  afterEach(() => { delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition; });

  it('sends the message to the n8n chat trigger and shows the agent reply', async () => {
    const fetchMock = reply('The Spanish Latte is PKR 720.');
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    await user.type(screen.getByLabelText('Your message'), 'How much is a Spanish Latte?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('The Spanish Latte is PKR 720.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe(CHAT_URL);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ action: 'sendMessage', chatInput: 'How much is a Spanish Latte?', metadata: { inputMode: 'text' } });
  });

  it('shows a menu card with the catalogue price for items the assistant mentions, and adds it to the order', async () => {
    vi.stubGlobal('fetch', reply('Try our Honey Cinnamon Latte with a Butter Croissant!'));
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    await user.type(screen.getByLabelText('Your message'), 'What do you recommend?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    const cards = await screen.findByLabelText('Menu items mentioned');
    expect(within(cards).getByText('Honey Cinnamon Latte')).toBeInTheDocument();
    expect(within(cards).getByText('PKR 780')).toBeInTheDocument();
    expect(within(cards).getByText('PKR 480')).toBeInTheDocument();

    await user.click(within(cards).getByRole('button', { name: 'Add Butter Croissant to your order' }));
    expect(screen.getByRole('link', { name: /View your order \(1\)/ })).toHaveAttribute('href', '/order');
  });

  it('sends a spoken message as voice input and turns on spoken replies', async () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
    const speakMock = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak: speakMock, cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; voice: unknown = null; constructor(text: string) { this.text = text; } });
    const fetchMock = reply('The Espresso is PKR 450.');
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    await user.click(screen.getByRole('button', { name: 'Speak your message' }));
    FakeRecognition.last?.say('how much is an espresso');

    expect(await screen.findByText('The Espresso is PKR 450.')).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ chatInput: 'how much is an espresso', metadata: { inputMode: 'voice' } });
    expect(speakMock).toHaveBeenCalledWith(expect.objectContaining({ text: 'The Espresso is 450 rupees.' }));
    expect(screen.getByRole('button', { name: 'Turn off spoken replies' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides the mic when the browser has no speech recognition', async () => {
    const user = userEvent.setup();
    renderWidget();
    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    expect(screen.queryByRole('button', { name: 'Speak your message' })).not.toBeInTheDocument();
  });

  it('shows an honest error instead of a fake reply when n8n fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 500 })));
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    await user.type(screen.getByLabelText('Your message'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable');
  });

  it('stays disabled with a setup hint when no chat URL is configured', async () => {
    const user = userEvent.setup();
    renderWidget('');
    await user.click(screen.getByRole('button', { name: 'Open Ask Morrow & Bean chat' }));
    expect(screen.getByLabelText('Your message')).toBeDisabled();
    expect(screen.getByText(/VITE_N8N_CHAT_URL/)).toBeInTheDocument();
  });
});

describe('chat helpers', () => {
  it('finds menu items by their exact names, in reply order, without double-counting', () => {
    expect(findMentionedItems('The Almond Croissant pairs well with a Flat White.').map((i) => i.id)).toEqual(['almond-croissant', 'flat-white']);
    expect(findMentionedItems('Our Morning Pairing is a Honey Cinnamon Latte and a Butter Croissant.').map((i) => i.id)).toEqual(['morning-pairing', 'honey-cinnamon-latte', 'butter-croissant']);
    // Lowercase ingredient words are not item mentions.
    expect(findMentionedItems('It is made with espresso and steamed milk.')).toEqual([]);
  });

  it('turns replies into speakable text', () => {
    expect(toSpeakable('**Spanish Latte** — PKR 1,050 ☕ see https://x.test')).toBe('Spanish Latte — 1,050 rupees see');
  });
});
