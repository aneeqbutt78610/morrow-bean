import { describe, expect, it } from 'vitest';
import { filterMenuItems, formatPrice, menuCategories, menuItems } from './menuItems';

describe('menu data', () => {
  it('contains all 14 specified menu items with four valid categories', () => {
    expect(menuItems).toHaveLength(14);
    expect(menuCategories).toEqual(['SIGNATURE COFFEE', 'ESPRESSO BAR', 'BAKERY', 'LIGHT BITES']);
    expect(new Set(menuItems.map((item) => item.id)).size).toBe(14);
  });

  it('keeps the required category counts and prices', () => {
    expect(menuItems.filter((item) => item.category === 'SIGNATURE COFFEE')).toHaveLength(4);
    expect(menuItems.filter((item) => item.category === 'ESPRESSO BAR')).toHaveLength(3);
    expect(menuItems.filter((item) => item.category === 'BAKERY')).toHaveLength(4);
    expect(menuItems.filter((item) => item.category === 'LIGHT BITES')).toHaveLength(3);
    expect(menuItems.find((item) => item.id === 'honey-cinnamon-latte')?.price).toBe(780);
    expect(menuItems.find((item) => item.id === 'grilled-chicken-sandwich')?.price).toBe(1150);
  });

  it('filters by case-insensitive item name and category together', () => {
    expect(filterMenuItems(menuItems, 'CROISSANT').map((item) => item.id)).toEqual(['butter-croissant', 'almond-croissant']);
    expect(filterMenuItems(menuItems, 'latte', 'SIGNATURE COFFEE')).toHaveLength(3);
    expect(filterMenuItems(menuItems, 'latte', 'BAKERY')).toHaveLength(0);
    expect(filterMenuItems(menuItems, '   ')).toHaveLength(14);
  });

  it('formats prices in PKR without losing thousands separators', () => {
    expect(formatPrice(650)).toBe('PKR 650');
    expect(formatPrice(1150)).toBe('PKR 1,150');
  });
});
