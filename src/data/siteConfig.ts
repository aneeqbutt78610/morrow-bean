import cafeInfo from '../../shared/cafe-info.json';
import { N8N_EVENTS_URL } from '../services/n8nEvents';

export const siteConfig = {
  // Name, tagline, social, and contact facts live in shared/cafe-info.json.
  brand: {
    ...cafeInfo.brand,
    wordmark: 'MORROW & BEAN',
    descriptor: 'CAFÉ · COFFEE · BAKES',
  },
  // Replace the placeholders in shared/cafe-info.json with verified details before launch.
  contact: cafeInfo.contact,
  // Contact inquiries go to the n8n events webhook as `inquiry.created`.
  contactFormEndpoint: N8N_EVENTS_URL,
  socialGallery: [
    {
      src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=85',
      alt: 'Coffee cup in warm morning light',
    },
    {
      src: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=85',
      alt: 'Fresh croissants arranged on a tray',
    },
    {
      src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=85',
      alt: 'Coffee being prepared at a café',
    },
    {
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85',
      alt: 'Warm, intimate café interior',
    },
  ],
} as const;
