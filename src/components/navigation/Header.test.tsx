import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import Home from '../../pages/Home';
import { OrderProvider } from '../order/OrderProvider';

const future = { v7_startTransition: true, v7_relativeSplatPath: true };

describe('navigation and page rendering', () => {
  it('renders all main desktop links and the menu CTA', () => {
    render(<OrderProvider><MemoryRouter future={future}><Header /></MemoryRouter></OrderProvider>);
    for (const label of ['Home', 'Our Story', 'Menu', 'Coffee & Bakes', 'Visit Us', 'Contact']) {
      expect(screen.getByRole('link', { name: label, hidden: false })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Explore Menu/ })).toHaveAttribute('href', '/menu');
  });

  it('renders the homepage brand message and primary actions', () => {
    render(<OrderProvider><MemoryRouter future={future}><Home /></MemoryRouter></OrderProvider>);
    expect(screen.getByRole('heading', { name: /Your Morning, Made Better/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Our Menu/ })).toHaveAttribute('href', '/menu');
    expect(screen.getByRole('link', { name: /Discover Our Story/ })).toHaveAttribute('href', '/our-story');
  });
});
