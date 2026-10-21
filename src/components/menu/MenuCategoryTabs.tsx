import type { MenuCategory } from '../../data/menuItems';

interface Props {
  categories: MenuCategory[];
  selected: MenuCategory | 'ALL';
  onChange: (category: MenuCategory | 'ALL') => void;
  includeAll?: boolean;
}

export default function MenuCategoryTabs({ categories, selected, onChange, includeAll = true }: Props) {
  const options: Array<MenuCategory | 'ALL'> = includeAll ? ['ALL', ...categories] : categories;
  return <div className="category-tabs" role="group" aria-label="Filter menu by category">
    {options.map((category) => <button type="button" key={category} className={`category-tab ${selected === category ? 'is-selected' : ''}`} aria-pressed={selected === category} onClick={() => onChange(category)}>{category === 'ALL' ? 'All favourites' : category.toLocaleLowerCase().replace(/\b\w/g, (letter) => letter.toLocaleUpperCase())}</button>)}
  </div>;
}
