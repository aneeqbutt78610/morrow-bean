import { ArrowDown, ArrowUpRight, Coffee, Croissant, MapPin, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import BrandMark from '../components/BrandMark';

// Three.js is heavy and only decorates the hero — load it as its own chunk, under
// the same conditions as the 3D cup (idle, motion allowed, no data-saver, WebGL),
// so it never delays the hero image (LCP).
const HeroAtmosphere = lazy(() => import('../components/motion/HeroAtmosphere').then((m) => ({ default: m.HeroAtmosphere })));
// The hero centrepiece is a small gate: it paints the poster immediately and lazy-
// loads the 3D cappuccino itself, so it's imported eagerly here.
import { HeroCoffee } from '../components/motion/HeroCoffee';
import { useAfterIdle } from '../hooks/useAfterIdle';
import { useCanLoadHeavyMedia } from '../hooks/useCanLoadHeavyMedia';
import PageMeta from '../components/PageMeta';
import SectionHeading from '../components/SectionHeading';
import MenuItemCard from '../components/menu/MenuItemCard';
import MorningPairingBanner from '../components/promotions/MorningPairingBanner';
import { menuItems } from '../data/menuItems';
import { siteConfig } from '../data/siteConfig';

export default function Home() {
  const featured = menuItems.filter((item) => ['honey-cinnamon-latte', 'spanish-latte', 'butter-croissant', 'chocolate-banana-bread'].includes(item.id));
  const reduce = useReducedMotion();
  const canLoadHeavyMedia = useCanLoadHeavyMedia();
  const heroIdle = useAfterIdle(canLoadHeavyMedia);
  const easeSmooth: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const easeEmph: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.11, delayChildren: reduce ? 0 : 0.06 } } };
  const rise: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeSmooth } } };
  const visual: Variants = { hidden: { opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 18 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: easeEmph } } };
  return <>
    <PageMeta title="Home" description="Fresh coffee, warm pastries, and a little more time for yourself at Morrow & Bean Café." />
    <section className="hero-section">
      {canLoadHeavyMedia && heroIdle && <Suspense fallback={null}><HeroAtmosphere /></Suspense>}
      <div className="hero-section__ornament hero-section__ornament--one" aria-hidden="true" />
      <div className="container hero-grid">
        <motion.div className="hero-copy" variants={container} initial="hidden" animate="show">
          <motion.div variants={rise}><BrandMark className="hero-brand" /></motion.div>
          <motion.p className="eyebrow hero-eyebrow" variants={rise}><span /> A CAFÉ FOR THE EVERYDAY RITUAL</motion.p>
          <motion.h1 variants={rise}>Your Morning,<br /><em>Made Better.</em></motion.h1>
          <motion.p className="hero-lede" variants={rise}>Fresh coffee. Warm pastries.<br />A little more time for yourself.</motion.p>
          <motion.div className="hero-actions" variants={rise}><Link to="/menu" className="button">Explore Our Menu <ArrowUpRight size={16} /></Link><Link to="/our-story" className="text-link">Discover Our Story <span>↗</span></Link></motion.div>
          <motion.div className="hero-note" variants={rise}><span className="hero-note__sun">✳</span><span>SMALL MOMENTS, A LITTLE MORE SPECIAL</span></motion.div>
        </motion.div>
        <motion.div className="hero-visual" variants={visual} initial="hidden" animate="show">
          <HeroCoffee />
          <div className="hero-visual__caption"><span className="hero-visual__caption-mark">✳</span><span><strong>Made for slow mornings</strong><small>GOOD COFFEE · BRIGHTER DAYS</small></span></div>
          <div className="hero-sticker" aria-label="Coffee and bakes, made with care"><span>COFFEE</span><span className="hero-sticker__spark">✳</span><span>BAKES</span></div>
        </motion.div>
      </div>
      <a href="#little-favourites" className="scroll-cue"><ArrowDown size={14} /> MEET YOUR NEW FAVOURITES</a>
    </section>

    <section className="section section--cream" id="little-favourites">
      <div className="container">
        <div className="section-heading-row"><SectionHeading eyebrow="A FEW GOOD THINGS" title="Little favourites,\nmade with care." description="Something lovely to sip. Something warm to share. Find your usual—or a new one." /><Link to="/menu" className="text-link section-side-link">See the full menu <ArrowUpRight size={15} /></Link></div>
        <div className="featured-grid">{featured.map((item, index) => <div className={`featured-grid__item featured-grid__item--${index + 1}`} key={item.id}><MenuItemCard item={item} compact /></div>)}</div>
      </div>
    </section>

    <section className="philosophy-section">
      <div className="philosophy-section__image"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1300&q=85" alt="Coffee being prepared with care behind the café counter" loading="lazy" width="1200" height="1100" /><span className="image-stamp">A LITTLE<br />MORE SLOW</span></div>
      <div className="philosophy-section__copy"><p className="eyebrow">OUR KIND OF EVERYDAY</p><h2>Made for the<br /><em>moments in between.</em></h2><p>Not every day needs to be a big occasion. Sometimes it’s a familiar cup, a just-baked pastry, or ten quiet minutes before the world gets busy.</p><p>At Morrow &amp; Bean, we make room for those little rituals—with thoughtful coffee, fresh bakes, and a warm welcome waiting for you.</p><Link to="/our-story" className="text-link">A little about us <ArrowUpRight size={15} /></Link><div className="philosophy-doodle" aria-hidden="true">✳</div></div>
    </section>

    <section className="section section--cream pairing-wrap"><div className="container"><MorningPairingBanner /></div></section>

    <section className="coffee-feature-section">
      <div className="container coffee-feature-grid">
        <div className="coffee-feature-copy"><p className="eyebrow">FROM THE COFFEE BAR</p><h2>A good cup<br />changes the <em>pace.</em></h2><p>From a beautifully balanced espresso to a honey-cinnamon latte, every cup is an invitation to take a breath and settle in.</p><Link to="/coffee-and-bakes" className="button button--outline">Meet the menu <ArrowUpRight size={15} /></Link><div className="coffee-feature-note"><Coffee size={20} /><span>YOUR USUAL, OR SOMETHING NEW.</span></div></div>
        <div className="coffee-feature-photo"><img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85" alt="Latte art on a freshly served cappuccino" loading="lazy" width="1000" height="1200" /><div className="photo-caption"><span>01 / 03</span><span>POURED WITH A LITTLE CARE</span></div></div>
        <div className="bakes-note"><Croissant size={24} strokeWidth={1.2} /><span>FRESH FROM THE OVEN</span><p>Flaky layers, cinnamon swirls, and the smell of something good baking.</p></div>
      </div>
    </section>

    <section className="visit-section">
      <div className="visit-section__texture" aria-hidden="true" />
      <div className="container visit-inner"><div><p className="eyebrow">MAKE A LITTLE TIME</p><h2>Your new<br /><em>favorite corner.</em></h2><p>Come for the coffee. Stay for the slower pace.</p><Link to="/visit-us" className="button button--cream">Find your way here <ArrowUpRight size={15} /></Link></div><div className="visit-info"><div><MapPin size={20} /><span><small>FIND US</small><strong>{siteConfig.contact.address}</strong></span></div><div><Clock3 size={20} /><span><small>OPENING HOURS</small><strong>{siteConfig.contact.hours}</strong></span></div><div><Coffee size={20} /><span><small>THE DAILY RITUAL</small><strong>Good coffee. Fresh bakes. Easy mornings.</strong></span></div></div></div>
    </section>

    <section className="section section--cream instagram-section">
      <div className="container"><div className="section-heading-row"><SectionHeading eyebrow="LITTLE MOMENTS, SHARED" title="A little more everyday." description="Coffee dates, pastry crumbs, and all the in-between moments." /><a className="text-link section-side-link" href={siteConfig.brand.instagramUrl} target="_blank" rel="noreferrer">Follow along <ArrowUpRight size={15} /></a></div><div className="instagram-grid">{siteConfig.socialGallery.map((item, index) => <a href={siteConfig.brand.instagramUrl} target="_blank" rel="noreferrer" key={item.src} className={`instagram-grid__item instagram-grid__item--${index + 1}`} aria-label={`View café moments on Instagram: ${item.alt}`}><img src={item.src} alt={item.alt} loading="lazy" width="800" height="800" /><span className="instagram-grid__overlay">↗</span></a>)}</div><p className="instagram-handle">FOLLOW OUR LITTLE RITUAL <span>·</span> {siteConfig.brand.instagram}</p></div>
    </section>
  </>;
}
