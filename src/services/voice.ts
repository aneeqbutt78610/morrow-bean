// Voice for the chat widget using the browser's built-in speech APIs — no backend or API key.
// Input: Web Speech recognition (Chrome, Edge, Safari). Output: speechSynthesis (all modern browsers).

interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike { isFinal: boolean; length: number; [index: number]: SpeechRecognitionAlternativeLike }
interface SpeechRecognitionEventLike { resultIndex: number; results: { length: number; [index: number]: SpeechRecognitionResultLike } }
interface SpeechRecognitionErrorEventLike { error: string }
export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const voiceInputSupported = () => recognitionConstructor() !== undefined;
export const voiceOutputSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

export interface ListenHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

/** Starts one listening session; returns a stop function. Returns null if unsupported. */
export function listen(handlers: ListenHandlers, lang = navigator.language || 'en-US'): (() => void) | null {
  const Recognition = recognitionConstructor();
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  let finalText = '';
  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) finalText += result[0].transcript;
      else interim += result[0].transcript;
    }
    handlers.onInterim((finalText + interim).trim());
  };
  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    handlers.onError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
      ? 'Microphone access is blocked. Allow it in your browser to talk to us.'
      : 'We couldn’t hear that clearly. Please try again or type your message.');
  };
  recognition.onend = () => {
    const text = finalText.trim();
    if (text) handlers.onFinal(text);
    handlers.onEnd();
  };
  recognition.start();
  return () => recognition.stop();
}

/** Plain, speakable text: no markdown symbols, links or emoji. */
export function toSpeakable(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#`>|~]/g, '')
    .replace(/\bPKR\s?([\d,]+)/g, '$1 rupees')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speak(text: string): void {
  if (!voiceOutputSupported()) return;
  const spoken = toSpeakable(text);
  if (!spoken) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(spoken);
  // Urdu script gets an Urdu voice when the device has one; everything else the default voice.
  if (/[؀-ۿ]/.test(spoken)) {
    utterance.lang = 'ur-PK';
    const urdu = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ur'));
    if (urdu) utterance.voice = urdu;
  }
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (voiceOutputSupported()) window.speechSynthesis.cancel();
}
