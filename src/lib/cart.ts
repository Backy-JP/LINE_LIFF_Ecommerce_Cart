export type CartItem = {
    product_id: string;
    qty: number;
  };
  
  const KEY = "cart_v1";
  
  export function getCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.product_id === "string" && Number.isFinite(x.qty))
        .map((x) => ({ product_id: x.product_id, qty: Math.max(1, Math.floor(x.qty)) }));
    } catch {
      return [];
    }
  }
  
  export function setCart(items: CartItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }
  
  export function addToCart(product_id: string, qty = 1) {
    const cart = getCart();
    const idx = cart.findIndex((x) => x.product_id === product_id);
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({ product_id, qty: Math.max(1, Math.floor(qty)) });
    setCart(cart);
    return cart;
  }
  
  export function updateQty(product_id: string, qty: number) {
    const cart = getCart();
    const q = Math.max(1, Math.floor(qty));
    const idx = cart.findIndex((x) => x.product_id === product_id);
    if (idx >= 0) cart[idx].qty = q;
    setCart(cart);
    return cart;
  }
  
  export function removeFromCart(product_id: string) {
    const cart = getCart().filter((x) => x.product_id !== product_id);
    setCart(cart);
    return cart;
  }
  
  export function clearCart() {
    setCart([]);
  }