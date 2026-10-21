import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import SectionHeading from '../components/SectionHeading';
import MenuCategoryTabs from '../components/menu/MenuCategoryTabs';
import MenuItemCard from '../components/menu/MenuItemCard';
import MorningPairingBanner from '../components/promotions/MorningPairingBanner';
import { filterMenuItems, menuCategories, menuItems, type MenuCategory } from '../data/menuItems';

export default function Menu() {
  const [selected, setSelected] = useState<MenuCategory | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterMenuItems(menuItems, query, selected), [query, selected]);
  return <>
    <PageMeta title="Menu" description="Explore Morrow & Bean Café’s signature coffee, espresso bar, fresh bakery, and light bites." />
    <section className="page-hero page-hero--menu"><div className="container page-hero__inner"><p className="eyebrow">A LITTLE SOMETHING FOR EVERY MOOD</p><h1>Good things,<br /><em>on the menu.</em></h1><p>From your usual order to a new favourite, find something made for your kind of morning.</p><div className="page-hero__decor" aria-hidden="true">✳</div></div><div className="page-hero__side-image"><img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1100&q=85" alt="Fresh croissants ready for the day" width="900" height="1100" /></div></section>
    <section className="section section--cream menu-page-section"><div className="container">
      <SectionHeading eyebrow="MADE TO BE SAVOURED" title="The café menu." description="Thoughtful coffee, fresh bakes, and little bites for a slower start." />
      <div className="menu-controls"><MenuCategoryTabs categories={menuCategories} selected={selected} onChange={setSelected} /><div className="menu-search"><Search size={17} /><label className="sr-only" htmlFor="menu-search-input">Search menu</label><input id="menu-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find something lovely…" /><button type="button" aria-label="Clear menu search" onClick={() => setQuery('')} disabled={!query}><X size={15} /></button></div></div>
      <p className="menu-result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'favourite' : 'favourites'} to explore</p>
      {filtered.length > 0 ? <div className="menu-grid">{filtered.map((item) => <MenuItemCard key={item.id} item={item} />)}</div> : <div className="empty-state"><span aria-hidden="true">✳</span><h3>Nothing on the menu by that name.</h3><p>Try another search or choose a different category.</p><button className="button button--outline" onClick={() => { setQuery(''); setSelected('ALL'); }}>Show the full menu</button></div>}
      <div className="menu-pairing"><MorningPairingBanner variant="compact" /></div>
      <p className="menu-footnote">Menu items and availability may change. Please ask the café team about ingredients or dietary requirements.</p>
    </div></section>
  </>;
}
