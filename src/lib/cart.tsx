import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  image?: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, size: string) => void;
  updateQty: (productId: string, size: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);

const STORAGE_KEY = "jerseyhub_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = (item) => {
    setItems((curr) => {
      const idx = curr.findIndex((i) => i.productId === item.productId && i.size === item.size);
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...curr, item];
    });
  };

  const remove: CartCtx["remove"] = (productId, size) =>
    setItems((curr) => curr.filter((i) => !(i.productId === productId && i.size === size)));

  const updateQty: CartCtx["updateQty"] = (productId, size, qty) =>
    setItems((curr) =>
      curr.map((i) =>
        i.productId === productId && i.size === size ? { ...i, quantity: Math.max(1, qty) } : i,
      ),
    );

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, updateQty, clear, total, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
