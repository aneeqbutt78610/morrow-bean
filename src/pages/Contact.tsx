import { ArrowUpRight, Instagram, Mail, MessageCircle } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import ContactForm from '../components/forms/ContactForm';
import { siteConfig } from '../data/siteConfig';

export default function Contact() {
  return <>
    <PageMeta title="Contact" description="Questions for Morrow & Bean Café? Send a note about the menu, a visit, feedback, or a possible collaboration." />
    <section className="contact-page"><div className="container contact-layout"><div className="contact-intro"><p className="eyebrow">WE’RE ALL EARS</p><h1>Have a little<br /><em>something to say?</em></h1><p>Questions about the menu, planning a visit, or just want to say hello? Send us a note.</p><div className="contact-direct"><a href={siteConfig.brand.instagramUrl} target="_blank" rel="noreferrer"><span><Instagram size={18} /></span><div><small>INSTAGRAM</small><strong>{siteConfig.brand.instagram}</strong></div><ArrowUpRight size={16} /></a>{siteConfig.contact.email && <a href={`mailto:${siteConfig.contact.email}`}><span><Mail size={18} /></span><div><small>EMAIL</small><strong>{siteConfig.contact.email}</strong></div><ArrowUpRight size={16} /></a>}<div className="contact-direct__note"><MessageCircle size={18} /><span>Our chat assistant is being prepared for a future n8n connection.</span></div></div><div className="contact-decoration" aria-hidden="true">✳</div></div><div className="contact-form-wrap"><p className="eyebrow">DROP US A NOTE</p><h2>What’s on your mind?</h2><p className="contact-form-intro">Fill in the details below and we’ll get back to you once the contact endpoint is connected.</p><ContactForm /></div></div></section>
  </>;
}
