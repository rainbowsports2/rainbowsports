import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — JerseyHub" }] }),
  component: Cart,
});

function Cart() {
  const { items, total, updateQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 font-display text-4xl">YOUR CART IS EMPTY</h1>
        <p className="mt-2 text-muted-foreground">Time to gear up.</p>
        <Link to="/shop">
          <Button size="lg" className="mt-8 h-12 bg-gradient-primary px-8 font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            Browse jerseys
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-5xl">YOUR CART</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded bg-muted">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col">
                <h3 className="font-display text-xl">{item.name}</h3>
                <p className="text-sm text-muted-foreground">Size {item.size}</p>
                <div className="mt-auto flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.productId, item.size, item.quantity - 1)}>−</Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.productId, item.size, item.quantity + 1)}>+</Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => remove(item.productId, item.size)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                <p className="font-display text-xl">₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-2xl">SUMMARY</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-accent">FREE</span></div>
          </div>
          <div className="my-4 border-t border-border" />
          <div className="flex justify-between font-display text-2xl">
            <span>Total</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
          <Link to="/checkout">
            <Button size="lg" className="mt-6 h-12 w-full bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
              Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
