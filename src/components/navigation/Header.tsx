import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu as MenuIcon, X, ShoppingBag } from 'lucide-react';
import { useOrder } from '../order/OrderProvider';
import BrandMark from '../BrandMark';

const links = [
  { to: '/', label: 'Home' },
  { to: '/our-story', label: 'Our Story' },
  { to: '/menu', label: 'Menu' },
  { to: '/coffee-and-bakes', label: 'Coffee & Bakes' },
  { to: '/visit-us', label: 'Visit Us' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { itemCount } = useOrder();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="container header-inner">
        <Link to="/" aria-label="Morrow & Bean Café homepage" className="header-brand"><BrandMark compact /></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>{link.label}</NavLink>)}
        </nav>
        <div className="header-actions"><Link to="/order" className="header-order" aria-label={`Your order, ${itemCount} items`}><ShoppingBag size={19} /><span>Order</span>{itemCount > 0 && <b>{itemCount}</b>}</Link><Link to="/menu" className="button button--small header-cta">Explore Menu <span aria-hidden="true">↗</span></Link></div>
        <button className="mobile-menu-toggle" type="button" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen((value) => !value)}>
          {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>
      <div id="mobile-navigation" className={`mobile-nav ${mobileOpen ? 'mobile-nav--open' : ''}`} hidden={!mobileOpen}>
        <nav aria-label="Mobile navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `mobile-nav__link ${isActive ? 'is-active' : ''}`}>{link.label}<span aria-hidden="true">↗</span></NavLink>)}
          <Link to="/order" className="mobile-nav__link mobile-nav__link--order"><span>Your order ({itemCount})</span><ShoppingBag size={17} /></Link><p className="mobile-nav__note">Slow mornings. Good coffee.</p>
        </nav>
      </div>
    </header>
  );
}
