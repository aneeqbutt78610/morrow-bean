import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm, { validateContactForm, type ContactFormValues } from './ContactForm';

const validValues: ContactFormValues = { name: 'Sam', email: 'sam@example.com', category: 'menu', message: 'Can you tell me about your coffee menu?' };

function fillForm() {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: validValues.name } });
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: validValues.email } });
  fireEvent.change(screen.getByLabelText('What can we help with?'), { target: { value: validValues.category } });
  fireEvent.change(screen.getByLabelText('Your message'), { target: { value: validValues.message } });
}

describe('contact form', () => {
  it('validates required fields, email, and minimum message length', () => {
    expect(validateContactForm({ ...validValues, name: '  ' })).toBe('Please enter your name.');
    expect(validateContactForm({ ...validValues, email: 'bad-email' })).toBe('Please enter a valid email address.');
    expect(validateContactForm({ ...validValues, message: 'short' })).toContain('at least 10 characters');
    expect(validateContactForm(validValues)).toBeNull();
  });

  it('does not show a false success when no submission endpoint is configured', async () => {
    const user = userEvent.setup();
    render(<ContactForm endpoint="" />);
    fillForm();
    await user.click(screen.getByRole('button', { name: /send your message/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not connected yet/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows success only after the configured endpoint responds successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const user = userEvent.setup();
    render(<ContactForm endpoint="https://forms.example.test/submit" />);
    fillForm();
    await user.click(screen.getByRole('button', { name: /send your message/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/has been submitted/i);
  });

  it('shows an error state if the endpoint fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const user = userEvent.setup();
    render(<ContactForm endpoint="https://forms.example.test/submit" />);
    fillForm();
    await user.click(screen.getByRole('button', { name: /send your message/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn’t submit/i));
  });
});
