import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X, Coffee, AlertCircle, Mic, Square, Volume2, VolumeX, Plus, Check } from 'lucide-react';
import { CHAT_URL, askAgent, type ChatInputMode } from '../../services/chatAgent';
import { findMentionedItems } from '../../services/chatMenuCards';
import { listen, speak, stopSpeaking, voiceInputSupported, voiceOutputSupported } from '../../services/voice';
import { formatPrice, type MenuItem } from '../../data/menuItems';
import { useOrder } from '../order/OrderProvider';

type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string; items?: MenuItem[] };

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ChatMenuCard({ item }: { item: MenuItem }) {
  const { addItem } = useOrder();
  const [added, setAdded] = useState(false);
  useEffect(() => { if (!added) return; const timer = setTimeout(() => setAdded(false), 1600); return () => clearTimeout(timer); }, [added]);
  return <article className="chat-card">
    <img src={item.image.replace('w=900', 'w=240')} alt={item.imageAlt} loading="lazy" width={64} height={64} />
    <div className="chat-card__body">
      <strong>{item.name}</strong>
      <span className="chat-card__price">{formatPrice(item.price)}</span>
      <p>{item.description}</p>
    </div>
    <button type="button" className={`chat-card__add ${added ? 'is-added' : ''}`} aria-label={added ? `${item.name} added to your order` : `Add ${item.name} to your order`} onClick={() => { addItem(item); setAdded(true); }}>{added ? <Check size={15} /> : <Plus size={15} />}</button>
  </article>;
}

// Rendered by SiteLayout, so it appears on every page and keeps the conversation across navigation.
export default function ChatbotWidget({ chatUrl = CHAT_URL }: { chatUrl?: string }) {
  const configured = chatUrl !== '';
  const { itemCount } = useOrder();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [canListen] = useState(voiceInputSupported);
  const [canSpeak] = useState(voiceOutputSupported);
  const [sessionId] = useState(createId);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', text: 'Hello there. Have a question about our menu or the Morning Pairing? Type, or tap the mic and just ask.' }]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const speakRef = useRef(speakReplies);
  speakRef.current = speakReplies;

  useEffect(() => { transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy, open]);
  useEffect(() => { if (open && !listening) inputRef.current?.focus(); }, [open, listening]);
  useEffect(() => { if (!open) { stopListeningRef.current?.(); stopSpeaking(); } }, [open]);
  useEffect(() => () => { stopListeningRef.current?.(); stopSpeaking(); }, []);

  async function send(raw: string, mode: ChatInputMode) {
    const text = raw.trim().slice(0, 1000);
    if (!text || busy || !configured) return;
    setError('');
    setMessages((current) => [...current, { id: createId(), role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await askAgent(chatUrl, sessionId, text, mode);
      setMessages((current) => [...current, { id: createId(), role: 'assistant', text: reply, items: findMentionedItems(reply) }]);
      if (speakRef.current) speak(reply);
    } catch {
      setError('Our assistant is unavailable right now. Please try again shortly, or use the Contact page.');
    } finally { setBusy(false); }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input, 'text');
  }

  function toggleListening() {
    if (listening) { stopListeningRef.current?.(); return; }
    setError('');
    stopSpeaking();
    // Talking to the assistant implies wanting to hear it back.
    if (canSpeak) setSpeakReplies(true);
    const stop = listen({
      onInterim: (text) => setInput(text),
      onFinal: (text) => { void send(text, 'voice'); },
      onError: (message) => setError(message),
      onEnd: () => { setListening(false); stopListeningRef.current = null; },
    });
    if (!stop) return;
    stopListeningRef.current = stop;
    setListening(true);
  }

  function toggleSpeakReplies() {
    setSpeakReplies((value) => { if (value) stopSpeaking(); return !value; });
  }

  const composerDisabled = !configured || busy;

  return <div className="chatbot-root">
    {open && <section className="chat-panel" aria-label="Ask Morrow & Bean chat">
      <header className="chat-panel__header">
        <span className="chat-panel__icon"><Coffee size={18} /></span>
        <span><strong>Ask Morrow &amp; Bean</strong><small>{!configured ? 'Chat not connected yet' : listening ? 'Listening…' : 'Here for your café questions'}</small></span>
        {canSpeak && <button type="button" className={`chat-panel__voice ${speakReplies ? 'is-on' : ''}`} aria-pressed={speakReplies} aria-label={speakReplies ? 'Turn off spoken replies' : 'Read replies aloud'} title={speakReplies ? 'Spoken replies on' : 'Read replies aloud'} onClick={toggleSpeakReplies}>{speakReplies ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>}
        <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}><X size={18} /></button>
      </header>
      <div className="chat-panel__transcript" ref={transcriptRef} aria-live="polite" data-lenis-prevent>
        {messages.map((message) => <div key={message.id} className={`chat-turn chat-turn--${message.role}`}>
          <div className={`chat-message chat-message--${message.role}`}>{message.text}</div>
          {message.items && message.items.length > 0 && <div className="chat-cards" aria-label="Menu items mentioned">{message.items.map((item) => <ChatMenuCard key={item.id} item={item} />)}</div>}
        </div>)}
        {busy && <div className="chat-message chat-message--assistant chat-message--typing"><span /><span /><span /><span className="sr-only">Assistant is replying</span></div>}
        {!configured && <div className="chat-unavailable"><AlertCircle size={16} /><span>Set VITE_N8N_CHAT_URL to the n8n chat trigger URL to turn this chat on.</span></div>}
        {error && <p className="chat-error" role="alert">{error}</p>}
        {itemCount > 0 && <Link to="/order" className="chat-cart-link" onClick={() => setOpen(false)}>View your order ({itemCount}) →</Link>}
      </div>
      <form className="chat-panel__composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-message-input">Your message</label>
        <input id="chat-message-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={listening ? 'Listening… speak now' : 'Ask us something…'} maxLength={1000} disabled={composerDisabled} readOnly={listening} />
        {canListen && <button type="button" className={`chat-panel__mic ${listening ? 'is-recording' : ''}`} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Speak your message'} title={listening ? 'Stop listening' : 'Speak your message'} disabled={composerDisabled} onClick={toggleListening}>{listening ? <Square size={15} /> : <Mic size={17} />}</button>}
        <button type="submit" aria-label="Send message" disabled={composerDisabled || listening || !input.trim()}><Send size={17} /></button>
      </form>
    </section>}
    <button type="button" className={`chat-launcher ${open ? 'chat-launcher--open' : ''}`} aria-label={open ? 'Close Ask Morrow & Bean chat' : 'Open Ask Morrow & Bean chat'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={21} /> : <><MessageCircle size={21} /><span className="chat-launcher__label">Ask us</span></>}</button>
  </div>;
}
