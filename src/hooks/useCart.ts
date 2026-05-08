import { useEffect, useMemo, useState } from "react";

export const CART_STORAGE_KEY = "jango3d_cart";
const CART_EVENT = "jango3d_cart_updated";

export type CartItem = {
  product_id: string;
  variant_id?: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: string;
  personalization: string;
  base_price: number;
  customization_price: number;
  final_price: number;
  quantity: number;
  production_days: number;
  extra_personalization_days?: number;
};

const readCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
};

const getItemKey = (item: Pick<CartItem, "product_id" | "variant_id" | "color" | "size" | "personalization">) =>
  [item.product_id, item.variant_id ?? "", item.color, item.size, item.personalization.trim()].join("|");

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(readCart);

  useEffect(() => {
    const sync = () => setItems(readCart());

    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = (nextItems: CartItem[]) => {
    setItems(nextItems);
    writeCart(nextItems);
  };

  const addItem = (item: CartItem) => {
    const normalizedItem = {
      ...item,
      quantity: Math.max(1, item.quantity),
      personalization: item.personalization.trim(),
    };

    const key = getItemKey(normalizedItem);
    const currentItems = readCart();
    const existingIndex = currentItems.findIndex((cartItem) => getItemKey(cartItem) === key);

    if (existingIndex >= 0) {
      const nextItems = currentItems.map((cartItem, index) =>
        index === existingIndex
          ? { ...cartItem, quantity: cartItem.quantity + normalizedItem.quantity }
          : cartItem,
      );
      persist(nextItems);
      return;
    }

    persist([...currentItems, normalizedItem]);
  };

  const removeItem = (index: number) => {
    persist(readCart().filter((_, itemIndex) => itemIndex !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    const nextQuantity = Math.max(1, quantity);
    persist(
      readCart().map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  };

  const clearCart = () => persist([]);

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.final_price * item.quantity, 0),
    [items],
  );

  const personalizationTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.customization_price * item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.base_price * item.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const averageProductionDays = useMemo(() => {
    if (!items.length) return 0;

    const totalDays = items.reduce((sum, item) => sum + item.production_days, 0);
    return Math.ceil(totalDays / items.length);
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    cartTotal,
    subtotal,
    personalizationTotal,
    itemCount,
    averageProductionDays,
  };
}
