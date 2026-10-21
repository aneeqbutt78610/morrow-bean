import { ArrowUpRight, Instagram, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../data/siteConfig';
import BrandMark from '../BrandMark';

const footerLinks = [
  { to: '/our-story', label: 'Our Story' },
  { to: '/menu', label: 'Explore Menu' },
  { to: '/coffee-and-bakes', label: 'Coffee & Bakes' },
  { to: '/visit-us', label: 'Visit Us' },
  { to: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-block">
          <Link to="/" className="footer-logo"><BrandMark light /></Link>
          <p>Slow mornings, thoughtful coffee, and something fresh from the oven.</p>
          <a className="footer-social" href={siteConfig.brand.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16} /> {siteConfig.brand.instagram} <ArrowUpRight size={14} /></a>
        </div>
        <div className="footer-nav-block"><p className="eyebrow footer-heading">EXPLORE</p>{footerLinks.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}</div>
        <div className="footer-visit-block"><p className="eyebrow footer-heading">COME BY</p><p><MapPin size={16} /> {siteConfig.contact.address}</p><p className="footer-small">{siteConfig.contact.hours}</p><Link className="footer-contact-link" to="/visit-us">Plan a visit <ArrowUpRight size={14} /></Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Morrow &amp; Bean Café</span><span>GOOD COFFEE <i /> FRESH BAKES <i /> EASY MORNINGS</span><a href="#top">Back to top ↑</a></div>
    </footer>
  );
}
