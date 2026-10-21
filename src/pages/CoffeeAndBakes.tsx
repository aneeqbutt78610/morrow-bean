import { useMemo, useState } from 'react';
import { ArrowUpRight, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageMeta from '../components/PageMeta';
import SectionHeading from '../components/SectionHeading';
import MenuCategoryTabs from '../components/menu/MenuCategoryTabs';
import MenuItemCard from '../components/menu/MenuItemCard';
import { filterMenuItems, menuCategories, menuItems, type MenuCategory, type MenuItem, formatPrice } from '../data/menuItems';
import { useOrder } from '../components/order/OrderProvider';

export default function CoffeeAndBakes() {
  const { addItem } = useOrder();
  const [selected, setSelected] = useState<MenuCategory | 'ALL'>('ALL');
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const filtered = useMemo(() => filterMenuItems(menuItems, '', selected), [selected]);
  return <>
    <PageMeta title="Coffee & Bakes" description="Meet the signature coffee, espresso, bakery, and light bites at Morrow & Bean Café." />
    <section className="page-hero page-hero--products"><div className="container page-hero__inner"><p className="eyebrow">POURED, BAKED, AND MADE TO ENJOY</p><h1>Coffee &amp; bakes.<br /><em>A very good pair.</em></h1><p>Comfort in a cup, something fresh from the oven, and a reason to take your time.</p><Link to="/menu" className="button">Browse the menu <ArrowUpRight size={15} /></Link></div><div className="page-hero__side-image"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1100&q=85" alt="Coffee and pastry at a café table" width="900" height="1100" /></div></section>
    <section className="section section--cream product-browser"><div className="container"><SectionHeading eyebrow="FIND YOUR FAVOURITE" title="Made for your kind of morning." description="Browse the little things that make a coffee break feel like yours." /><MenuCategoryTabs categories={menuCategories} selected={selected} onChange={setSelected} /><div className="menu-grid">{filtered.map((item) => <MenuItemCard key={item.id} item={item} onSelect={setActiveItem} />)}</div></div></section>
    {activeItem && <div className="modal-backdrop" role="presentation" data-lenis-prevent onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveItem(null); }}><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><button className="product-modal__close" type="button" aria-label="Close product details" onClick={() => setActiveItem(null)}><X size={20} /></button><img src={activeItem.image} alt={activeItem.imageAlt} width="900" height="720" /><div className="product-modal__content"><p className="eyebrow">{activeItem.category}</p><h2 id="product-modal-title">{activeItem.name}</h2><p>{activeItem.description}</p><strong>{formatPrice(activeItem.price)}</strong><button type="button" className="button" onClick={() => { addItem(activeItem); setActiveItem(null); }}>Add to your order <Plus size={15} /></button><Link to="/menu" className="text-link" onClick={() => setActiveItem(null)}>Explore full menu <ArrowUpRight size={15} /></Link></div></section></div>}
  </>;
}
