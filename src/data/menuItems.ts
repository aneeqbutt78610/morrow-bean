import catalog from '../../shared/menu-catalog.json';

export type MenuCategory = 'SIGNATURE COFFEE' | 'ESPRESSO BAR' | 'BAKERY' | 'LIGHT BITES';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  image: string;
  imageAlt: string;
  featured?: boolean;
  promotion?: boolean;
}

interface CatalogItem extends Omit<MenuItem, 'image'> {
  imageId: string;
}

const image = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const orderableItems: MenuItem[] = (catalog as CatalogItem[]).map(({ imageId, ...item }) => ({
  ...item,
  image: image(imageId),
}));

// Promotions are orderable but not listed as standalone regular menu items.
export const menuItems: MenuItem[] = orderableItems.filter((item) => !item.promotion);

export const menuCategories: MenuCategory[] = [
  'SIGNATURE COFFEE',
  'ESPRESSO BAR',
  'BAKERY',
  'LIGHT BITES',
];

export const morningPairing = {
  name: 'Morning Pairing',
  items: 'Honey Cinnamon Latte + Butter Croissant',
  price: 1050,
  availability: 'Available daily until 11:30 AM',
};

export function filterMenuItems(items: MenuItem[], query: string, category: MenuCategory | 'ALL' = 'ALL'): MenuItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    const matchesCategory = category === 'ALL' || item.category === category;
    const matchesQuery = !normalizedQuery || `${item.name} ${item.description} ${item.category}`.toLocaleLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}

export function formatPrice(price: number): string {
  return `PKR ${price.toLocaleString('en-PK')}`;
}
