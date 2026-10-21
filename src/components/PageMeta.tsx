import { useEffect } from 'react';

export default function PageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | Morrow & Bean Café`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
    return () => { document.title = 'Morrow & Bean Café — Your Morning, Made Better'; };
  }, [title, description]);
  return null;
}
