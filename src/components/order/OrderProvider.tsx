import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { orderableItems, type MenuItem } from '../../data/menuItems';
import type { CartLine } from '../../services/orderService';

interface OrderContextValue {
  cart: CartLine[];
  itemCount: number;
  addItem: (item: MenuItem, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CART_KEY = 'morrow-bean-cart-v1';
const OrderContext = createContext<OrderContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const knownIds = new Set(orderableItems.map((item) => item.id));
    return parsed.filter((item): item is CartLine => item && typeof item.id === 'string' && knownIds.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20);
  } catch { return []; }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(readStoredCart);
  const save = useCallback((next: CartLine[]) => {
    setCart(next);
    try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch { /* Cart still works for this visit if storage is unavailable. */ }
  }, []);
  const addItem = useCallback((item: MenuItem, quantity = 1) => {
    setCart((current) => {
      const exists = current.find((line) => line.id === item.id);
      const next = exists
        ? current.map((line) => line.id === item.id ? { ...line, quantity: Math.min(20, line.quantity + quantity) } : line)
        : [...current, { id: item.id, quantity: Math.min(20, Math.max(1, quantity)) }];
      try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch { /* Non-blocking storage failure. */ }
      return next;
    });
  }, []);
  const setQuantity = useCallback((id: string, quantity: number) => {
    setCart((current) => {
      const next = quantity <= 0 ? current.filter((line) => line.id !== id) : current.map((line) => line.id === id ? { ...line, quantity: Math.min(20, quantity) } : line);
      try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch { /* Non-blocking storage failure. */ }
      return next;
    });
  }, []);
  const removeItem = useCallback((id: string) => setQuantity(id, 0), [setQuantity]);
  const clearCart = useCallback(() => save([]), [save]);
  const value = useMemo(() => ({ cart, itemCount: cart.reduce((sum, line) => sum + line.quantity, 0), addItem, setQuantity, removeItem, clearCart }), [cart, addItem, setQuantity, removeItem, clearCart]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used within OrderProvider.');
  return context;
}
