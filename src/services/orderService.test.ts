import { describe, expect, it, vi } from 'vitest';
import { menuItems } from '../data/menuItems';
import { buildOrder, calculateCartTotal, submitOrder } from './orderService';

const N8N_URL = 'https://n8n.example.test/webhook/morrow-events';
const customer = { name: 'Demo Customer', phone: '03001234567' };

describe('order service', () => {
  it('calculates totals from the shared menu catalogue', () => {
    expect(calculateCartTotal(menuItems, [{ id: 'honey-cinnamon-latte', quantity: 2 }, { id: 'butter-croissant', quantity: 1 }])).toBe(2040);
  });

  it('builds order totals from trusted catalogue prices', () => {
    const order = buildOrder({ customer: { ...customer, email: 'test@example.com' }, fulfillment: 'pickup', items: [{ id: 'honey-cinnamon-latte', quantity: 2 }, { id: 'butter-croissant', quantity: 1 }] });
    expect(order.total).toBe(2040);
    expect(order.items[0].unitPrice).toBe(780);
    expect(order.items[1].lineTotal).toBe(480);
    expect(order.id).toMatch(/^MB-\d{8}-[A-F0-9]{6}$/);
    expect(order.status).toBe('received');
  });

  it('rejects unknown items, bad quantities, missing details and short delivery addresses', () => {
    expect(() => buildOrder({ customer, fulfillment: 'pickup', items: [{ id: 'pretend-item', quantity: 1 }] })).toThrow(/no longer available/i);
    expect(() => buildOrder({ customer, fulfillment: 'pickup', items: [{ id: 'espresso', quantity: 0 }] })).toThrow(/quantity/i);
    expect(() => buildOrder({ customer: { name: 'T', phone: '123' }, fulfillment: 'pickup', items: [{ id: 'espresso', quantity: 1 }] })).toThrow(/full name/i);
    expect(() => buildOrder({ customer, fulfillment: 'delivery', address: 'tiny', items: [{ id: 'espresso', quantity: 1 }] })).toThrow(/delivery address/i);
  });

  it('keeps the morning pairing orderable at its configured PKR price', () => {
    const order = buildOrder({ customer, fulfillment: 'pickup', items: [{ id: 'morning-pairing', quantity: 1 }] });
    expect(order.items[0].name).toBe('Morning Pairing');
    expect(order.total).toBe(1050);
  });

  it('sends an order.created event to n8n and confirms only after n8n accepts it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const result = await submitOrder({ customer, fulfillment: 'pickup', items: [{ id: 'espresso', quantity: 2 }] }, N8N_URL);
    expect(result.total).toBe(900);
    expect(fetchMock).toHaveBeenCalledWith(N8N_URL, expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ event: 'order.created', source: 'morrow-bean-website', data: { id: result.id, total: 900, customer: { name: 'Demo Customer' } } });
  });

  it('surfaces an error instead of a fake confirmation when n8n fails or is not configured', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(submitOrder({ customer, fulfillment: 'pickup', items: [{ id: 'espresso', quantity: 1 }] }, N8N_URL)).rejects.toThrow(/could not place/i);
    await expect(submitOrder({ customer, fulfillment: 'pickup', items: [{ id: 'espresso', quantity: 1 }] }, '')).rejects.toThrow(/not connected/i);
  });
});
