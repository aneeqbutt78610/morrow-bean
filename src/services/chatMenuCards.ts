import { orderableItems, type MenuItem } from '../data/menuItems';

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Item names as the assistant writes them ("Spanish Latte"). Case-sensitive on purpose, so
// "espresso" used as an ingredient doesn't show the Espresso card; longest names win first.
const matchers = [...orderableItems]
  .sort((a, b) => b.name.length - a.name.length)
  .map((item) => ({ item, pattern: new RegExp(`(^|[^A-Za-z])${escape(item.name)}(?![A-Za-z])`) }));

/**
 * Menu items named in an assistant reply, in the order they appear (max `limit`).
 * Prices come from the site's own catalogue, never from the model's text.
 */
export function findMentionedItems(text: string, limit = 4): MenuItem[] {
  let remaining = text;
  const found: Array<{ item: MenuItem; index: number }> = [];
  for (const { item, pattern } of matchers) {
    const match = pattern.exec(remaining);
    if (!match) continue;
    found.push({ item, index: match.index });
    // Blank out the match so "Butter Croissant" doesn't also count as a shorter name inside it.
    remaining = remaining.slice(0, match.index) + ' '.repeat(match[0].length) + remaining.slice(match.index + match[0].length);
  }
  return found.sort((a, b) => a.index - b.index).slice(0, limit).map(({ item }) => item);
}
