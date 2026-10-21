import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageMeta from '../components/PageMeta';
import { useOrder } from '../components/order/OrderProvider';
import { formatPrice, orderableItems } from '../data/menuItems';
import { calculateCartTotal, submitOrder, type CartLine, type OrderConfirmation } from '../services/orderService';

export default function Order() {
  const { cart, setQuantity, removeItem, clearCart } = useOrder();
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const cartItems = useMemo(() => cart.map((line) => ({ line, item: orderableItems.find((item) => item.id === line.id) })).filter((entry): entry is { line: CartLine; item: (typeof orderableItems)[number] } => Boolean(entry.item)), [cart]);
  const total = calculateCartTotal(orderableItems, cart);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (cartItems.length === 0) { setError('Add at least one item before placing your order.'); return; }
    if (customer.name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (customer.phone.replace(/[\s()+.-]/g, '').length < 7) { setError('Please enter a valid phone number.'); return; }
    if (fulfillment === 'delivery' && address.trim().length < 8) { setError('Please enter a complete delivery address.'); return; }
    setSubmitting(true);
    try {
      const order = await submitOrder({ customer: { ...customer, name: customer.name.trim(), phone: customer.phone.trim(), email: customer.email.trim() }, fulfillment, address: address.trim(), notes: notes.trim(), items: cart.map(({ id, quantity }) => ({ id, quantity })) });
      setConfirmation(order);
      clearCart();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not place your order. Please try again.');
    } finally { setSubmitting(false); }
  }

  if (confirmation) return <>
    <PageMeta title="Order Received" description="Your Morrow & Bean Café order has been received by the café team." />
    <section className="order-page section section--cream"><div className="container order-confirmation"><span className="order-confirmation__icon"><CheckCircle2 size={34} /></span><p className="eyebrow">ORDER RECEIVED</p><h1>That’s something<br /><em>to look forward to.</em></h1><p>Your order has been sent to the café team. They will confirm fulfilment details before preparation.</p><div className="order-confirmation__details"><div><span>Order reference</span><strong>{confirmation.id}</strong></div><div><span>Order total</span><strong>{formatPrice(confirmation.total)}</strong></div><div><span>Payment</span><strong>{confirmation.payment}</strong></div></div><p className="muted-note">No payment has been collected. Pay at pickup or on delivery once the café confirms.</p><Link to="/menu" className="button">Back to the menu <ArrowRight size={16} /></Link></div></section>
  </>;

  return <>
    <PageMeta title="Your Order" description="Review your Morrow & Bean Café order and send your pickup or delivery request." />
    <section className="order-hero"><div className="container order-hero__inner"><p className="eyebrow">A FEW GOOD THINGS, COMING UP</p><h1>Your order,<br /><em>your little ritual.</em></h1><p>Choose your favourites, leave us the details, and place your order request.</p></div></section>
    <section className="order-page section section--cream"><div className="container order-layout">
      <div className="order-cart"><div className="order-section-title"><div><p className="eyebrow">THE GOOD STUFF</p><h2>Your basket <span>({cart.reduce((sum, line) => sum + line.quantity, 0)})</span></h2></div><Link to="/menu" className="text-link"><ArrowLeft size={15} /> Keep browsing</Link></div>
        {cartItems.length ? <div className="order-lines">{cartItems.map(({ line, item }) => <article key={item.id} className="order-line"><img src={item.image} alt={item.imageAlt} width="180" height="180" /><div className="order-line__info"><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><span>{formatPrice(item.price)}</span><div className="quantity-control" aria-label={`Quantity for ${item.name}`}><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => setQuantity(item.id, line.quantity - 1)}><Minus size={14} /></button><span>{line.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => setQuantity(item.id, line.quantity + 1)} disabled={line.quantity >= 20}><Plus size={14} /></button></div></div><div className="order-line__end"><strong>{formatPrice(item.price * line.quantity)}</strong><button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)} className="order-line__remove"><Trash2 size={16} /></button></div></article>)}</div> : <div className="order-empty"><ShoppingBag size={30} /><h3>Your basket is taking a slow morning.</h3><p>It looks like you haven’t added anything yet.</p><Link className="button" to="/menu">Explore the menu <ArrowRight size={15} /></Link></div>}
        {cartItems.length > 0 && <div className="order-total"><span>Subtotal</span><strong>{formatPrice(total)}</strong><small>Final fulfilment details and any delivery costs must be confirmed by the café team.</small></div>}
      </div>
      <form className="checkout-form" onSubmit={handleSubmit} noValidate><p className="eyebrow">THE PRACTICAL BITS</p><h2>Where should we find you?</h2><div className="form-field"><label htmlFor="order-name">Full name *</label><input id="order-name" name="name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} autoComplete="name" maxLength={100} required /></div><div className="form-field"><label htmlFor="order-phone">Phone number *</label><input id="order-phone" name="phone" type="tel" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} autoComplete="tel" maxLength={40} placeholder="03XX XXXXXXX" required /></div><div className="form-field"><label htmlFor="order-email">Email (optional)</label><input id="order-email" name="email" type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} autoComplete="email" maxLength={254} /></div><fieldset className="fulfillment-field"><legend>How would you like your order?</legend><label className={`fulfillment-option ${fulfillment === 'pickup' ? 'is-selected' : ''}`}><input type="radio" name="fulfillment" value="pickup" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /><span><strong>Pick-up</strong><small>Collect at the café after confirmation.</small></span></label><label className={`fulfillment-option ${fulfillment === 'delivery' ? 'is-selected' : ''}`}><input type="radio" name="fulfillment" value="delivery" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /><span><strong>Delivery request</strong><small>Availability and charges need café confirmation.</small></span></label></fieldset>{fulfillment === 'delivery' && <div className="form-field"><label htmlFor="order-address">Delivery address *</label><textarea id="order-address" value={address} onChange={(event) => setAddress(event.target.value)} rows={3} maxLength={300} placeholder="House / street / area / city" required /></div>}<div className="form-field"><label htmlFor="order-notes">Order notes (optional)</label><textarea id="order-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={500} placeholder="Any helpful details for the café team?" /></div>{error && <p className="order-error" role="alert">{error}</p>}<div className="checkout-total"><span>Order total</span><strong>{formatPrice(total)}</strong></div><button type="submit" className="button checkout-submit" disabled={submitting || cartItems.length === 0}>{submitting ? 'Placing order…' : 'Place order request'} <ArrowRight size={16} /></button><p className="order-terms">No online payment is taken. Your order goes straight to the café team so they can confirm the next step.</p></form>
    </div></section>
  </>;
}
