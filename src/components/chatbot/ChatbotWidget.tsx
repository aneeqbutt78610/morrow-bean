import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X, Coffee, AlertCircle } from 'lucide-react';
import { CHAT_URL, askAgent } from '../../services/chatAgent';

type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string };

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Rendered by SiteLayout, so it appears on every page and keeps the conversation across navigation.
export default function ChatbotWidget({ chatUrl = CHAT_URL }: { chatUrl?: string }) {
  const configured = chatUrl !== '';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionId] = useState(createId);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', text: 'Hello there. Have a question about our menu or the Morning Pairing? We’re happy to help.' }]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim().slice(0, 1000);
    if (!text || busy || !configured) return;
    setError('');
    setMessages((current) => [...current, { id: createId(), role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await askAgent(chatUrl, sessionId, text);
      setMessages((current) => [...current, { id: createId(), role: 'assistant', text: reply }]);
    } catch {
      setError('Our assistant is unavailable right now. Please try again shortly, or use the Contact page.');
    } finally { setBusy(false); }
  }

  return <div className="chatbot-root">
    {open && <section className="chat-panel" aria-label="Ask Morrow & Bean chat">
      <header className="chat-panel__header">
        <span className="chat-panel__icon"><Coffee size={18} /></span>
        <span><strong>Ask Morrow &amp; Bean</strong><small>{configured ? 'Here for your café questions' : 'Chat not connected yet'}</small></span>
        <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}><X size={18} /></button>
      </header>
      <div className="chat-panel__transcript" ref={transcriptRef} aria-live="polite" data-lenis-prevent>
        {messages.map((message) => <div key={message.id} className={`chat-message chat-message--${message.role}`}>{message.text}</div>)}
        {busy && <div className="chat-message chat-message--assistant chat-message--typing"><span /><span /><span /><span className="sr-only">Assistant is replying</span></div>}
        {!configured && <div className="chat-unavailable"><AlertCircle size={16} /><span>Set VITE_N8N_CHAT_URL to the n8n chat trigger URL to turn this chat on.</span></div>}
        {error && <p className="chat-error" role="alert">{error}</p>}
      </div>
      <form className="chat-panel__composer" onSubmit={handleSend}>
        <label className="sr-only" htmlFor="chat-message-input">Your message</label>
        <input id="chat-message-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask us something…" maxLength={1000} disabled={!configured} />
        <button type="submit" aria-label="Send message" disabled={busy || !configured || !input.trim()}><Send size={17} /></button>
      </form>
    </section>}
    <button type="button" className={`chat-launcher ${open ? 'chat-launcher--open' : ''}`} aria-label={open ? 'Close Ask Morrow & Bean chat' : 'Open Ask Morrow & Bean chat'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={21} /> : <><MessageCircle size={21} /><span className="chat-launcher__label">Ask us</span></>}</button>
  </div>;
}
