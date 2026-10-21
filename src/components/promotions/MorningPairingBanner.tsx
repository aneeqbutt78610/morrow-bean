import { ArrowUpRight, Sun, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { morningPairing, formatPrice, orderableItems } from '../../data/menuItems';
import { useOrder } from '../order/OrderProvider';

interface Props { variant?: 'wide' | 'compact' }

export default function MorningPairingBanner({ variant = 'wide' }: Props) {
  const { addItem } = useOrder();
  const bundle = orderableItems.find((item) => item.id === 'morning-pairing');
  return <section className={`pairing-banner pairing-banner--${variant}`} aria-label="Morning Pairing special offer">
    <div className="pairing-banner__decoration" aria-hidden="true"><Sun size={variant === 'wide' ? 108 : 68} strokeWidth={0.8} /><span>✳</span></div>
    <div className="pairing-banner__copy"><p className="eyebrow">A LITTLE MORNING RITUAL</p><h2>{morningPairing.name}<br /><em>made for two hands.</em></h2><p>{morningPairing.items}</p><span className="pairing-banner__availability">{morningPairing.availability}</span></div>
    <div className="pairing-banner__offer"><span className="pairing-banner__price-label">YOUR MORNING PAIRING</span><strong>{formatPrice(morningPairing.price)}</strong><button type="button" className="button button--cream" onClick={() => { if (bundle) addItem(bundle); }}>Add pairing to order <Plus size={15} /></button><Link to="/menu" className="pairing-banner__menu-link">Explore full menu <ArrowUpRight size={15} /></Link></div>
  </section>;
}
