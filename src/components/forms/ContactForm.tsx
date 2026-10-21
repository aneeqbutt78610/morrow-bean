import { useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { siteConfig } from '../../data/siteConfig';
import { createReference, sendEvent } from '../../services/n8nEvents';

export interface ContactFormValues {
  name: string;
  email: string;
  category: string;
  message: string;
}

export function validateContactForm(values: ContactFormValues): string | null {
  if (!values.name.trim()) return 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Please enter a valid email address.';
  if (!values.category) return 'Please choose an inquiry type.';
  if (values.message.trim().length < 10) return 'Please add a little more detail (at least 10 characters).';
  if (values.message.length > 2000) return 'Please keep your message under 2,000 characters.';
  return null;
}

interface Props { endpoint?: string }

export default function ContactForm({ endpoint = siteConfig.contactFormEndpoint }: Props) {
  const [values, setValues] = useState<ContactFormValues>({ name: '', email: '', category: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unconfigured'>('idle');
  const [feedback, setFeedback] = useState('');

  const update = (field: keyof ContactFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (status !== 'idle') { setStatus('idle'); setFeedback(''); }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateContactForm(values);
    if (validationError) { setStatus('error'); setFeedback(validationError); return; }
    if (!endpoint.trim()) { setStatus('unconfigured'); setFeedback('The contact form is not connected yet. Please use the café’s confirmed contact channel once it is added.'); return; }

    setStatus('loading');
    setFeedback('');
    try {
      const inquiry = { id: createReference('MB-INQ'), createdAt: new Date().toISOString(), name: values.name.trim(), email: values.email.trim(), category: values.category, message: values.message.trim() };
      await sendEvent(endpoint, 'inquiry.created', inquiry);
      setStatus('success');
      setFeedback('Thank you for reaching out. Your message has been submitted.');
      setValues({ name: '', email: '', category: '', message: '' });
    } catch {
      setStatus('error');
      setFeedback('We couldn’t submit your message just now. Please try again later.');
    }
  }

  return <form className="contact-form" onSubmit={handleSubmit} noValidate>
    <div className="form-field"><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" value={values.name} onChange={(event) => update('name', event.target.value)} placeholder="How should we address you?" autoComplete="name" required maxLength={100} /></div>
    <div className="form-field"><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" autoComplete="email" required maxLength={254} /></div>
    <div className="form-field"><label htmlFor="contact-category">What can we help with?</label><select id="contact-category" name="category" value={values.category} onChange={(event) => update('category', event.target.value)} required><option value="">Choose a topic</option><option value="menu">Menu question</option><option value="visit">Visit or opening hours</option><option value="feedback">Feedback</option><option value="collaboration">Collaboration</option><option value="other">Something else</option></select></div>
    <div className="form-field"><div className="form-field__label-row"><label htmlFor="contact-message">Your message</label><span>{values.message.length}/2000</span></div><textarea id="contact-message" name="message" value={values.message} onChange={(event) => update('message', event.target.value)} placeholder="Write us a little note…" rows={5} required maxLength={2000} /></div>
    {feedback && <p className={`form-feedback form-feedback--${status}`} role={status === 'success' ? 'status' : 'alert'}>{status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{feedback}</p>}
    <button className="button form-submit" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Sending…' : 'Send your message'} <ArrowUpRight size={16} /></button>
    <p className="form-privacy-note">Your details are used only to respond to this inquiry. Connect a trusted form endpoint before accepting live submissions.</p>
  </form>;
}
