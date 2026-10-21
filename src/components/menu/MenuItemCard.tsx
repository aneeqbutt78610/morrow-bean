import { ArrowUpRight, Plus } from 'lucide-react';
import { useOrder } from '../order/OrderProvider';
import type { MenuItem } from '../../data/menuItems';
import { formatPrice } from '../../data/menuItems';

interface Props { item: MenuItem; onSelect?: (item: MenuItem) => void; compact?: boolean }

export default function MenuItemCard({ item, onSelect, compact = false }: Props) {
  const { addItem } = useOrder();
  const content = (
    <>
      <div className="menu-card__image-wrap"><img src={item.image} alt={item.imageAlt} loading="lazy" width="900" height="720" /><span className="menu-card__image-mark" aria-hidden="true">✳</span></div>
      <div className="menu-card__body"><div className="menu-card__topline"><h3>{item.name}</h3><span className="menu-card__price">{formatPrice(item.price)}</span></div><p>{item.description}</p>{onSelect && <span className="menu-card__details">View details <ArrowUpRight size={14} /></span>}</div>
    </>
  );

  if (onSelect) {
    return <button type="button" className={`menu-card menu-card--button ${compact ? 'menu-card--compact' : ''}`} onClick={() => onSelect(item)} aria-label={`View details for ${item.name}`}>{content}</button>;
  }
  return <article className={`menu-card ${compact ? 'menu-card--compact' : ''}`}>{content}<button type="button" className="menu-card__add" onClick={() => addItem(item)} aria-label={`Add ${item.name} to your order`}><Plus size={15} /><span>Add to order</span></button></article>;
}
