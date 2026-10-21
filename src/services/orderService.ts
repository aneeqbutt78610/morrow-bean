import { orderableItems, type MenuItem } from '../data/menuItems';
import { createReference, N8N_EVENTS_URL, sendEvent } from './n8nEvents';

export interface CartLine { id: string; quantity: number }
export interface OrderSubmission {
  customer: { name: string; phone: string; email?: string };
  fulfillment: 'pickup' | 'delivery';
  address?: string;
  notes?: string;
  items: CartLine[];
}
export interface OrderConfirmation {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  payment: string;
  items: Array<{ id: string; name: string; unitPrice: number; quantity: number; lineTotal: number }>;
}
export interface Order extends OrderConfirmation {
  customer: { name: string; phone: string; email: string };
  fulfillment: 'pickup' | 'delivery';
  address: string;
  notes: string;
}

/** Online-order limits — also quoted by the n8n assistant. */
export const ORDER_LIMITS = { maxQuantity: 20, maxLines: 30, maxTotal: 100000 };

const catalogById = new Map(orderableItems.map((item) => [item.id, item]));

function cleanText(value: unknown, limit = 500): string {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, limit);
}

export function calculateCartTotal(items: MenuItem[], cart: CartLine[]): number {
  const prices = new Map(items.map((item) => [item.id, item.price]));
  return cart.reduce((total, line) => total + (prices.get(line.id) ?? 0) * line.quantity, 0);
}

/** Validates a checkout and prices it from the shared menu catalogue (never from the cart). */
export function buildOrder(payload: OrderSubmission, now = new Date()): Order {
  const name = cleanText(payload.customer?.name, 100);
  const phone = cleanText(payload.customer?.phone, 40);
  const email = cleanText(payload.customer?.email, 254);
  const fulfillment = payload.fulfillment === 'delivery' ? 'delivery' : 'pickup';
  const address = cleanText(payload.address, 300);
  const notes = cleanText(payload.notes, 500);

  if (name.length < 2) throw new Error('Please enter your full name.');
  if (phone.replace(/[\s()+.-]/g, '').length < 7) throw new Error('Please enter a valid phone number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (fulfillment === 'delivery' && address.length < 8) throw new Error('Please enter a complete delivery address.');
  if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error('Add at least one item to your order.');
  if (payload.items.length > ORDER_LIMITS.maxLines) throw new Error('This order has too many line items.');

  const items = payload.items.map((entry) => {
    const product = catalogById.get(String(entry?.id ?? ''));
    const quantity = Number(entry?.quantity);
    if (!product) throw new Error('One of the selected menu items is no longer available. Please review your order.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > ORDER_LIMITS.maxQuantity) throw new Error(`Choose a quantity between 1 and ${ORDER_LIMITS.maxQuantity} for ${product.name}.`);
    return { id: product.id, name: product.name, unitPrice: product.price, quantity, lineTotal: product.price * quantity };
  });

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (total > ORDER_LIMITS.maxTotal) throw new Error('The order total is above the online order limit. Please contact the café.');
  return {
    id: createReference('MB', now),
    createdAt: now.toISOString(),
    status: 'received',
    customer: { name, phone, email },
    fulfillment,
    address: fulfillment === 'delivery' ? address : '',
    notes,
    items,
    total,
    payment: 'Pay at pickup / on delivery',
  };
}

/** Sends the order to n8n. Confirms only after n8n accepted it — never a fake success. */
export async function submitOrder(payload: OrderSubmission, eventsUrl = N8N_EVENTS_URL): Promise<OrderConfirmation> {
  const order = buildOrder(payload);
  if (!eventsUrl) throw new Error('Online ordering is not connected yet. Please contact the café to place your order.');
  try {
    await sendEvent(eventsUrl, 'order.created', order);
  } catch {
    throw new Error('We could not place your order. Please try again.');
  }
  return order;
}
