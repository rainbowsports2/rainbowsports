import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My orders — Rainbow Sports" }] }),
  component: Orders,
});

type Order = {
  id: string;
  tracking_number: string | null;
  created_at: string;
  total: number;
  status: string;
  payment_method: string;
  customer_name: string;
  city: string;
  order_items: { product_name: string; quantity: number; size: string }[];
};

function Orders() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, tracking_number, created_at, total, status, payment_method, customer_name, city, order_items(product_name, quantity, size)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as any);
        setFetching(false);
      });
  }, [user]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">Loading...</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-4xl">SIGN IN TO VIEW ORDERS</h1>
        <Link to="/auth">
          <Button size="lg" className="mt-6 bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-5xl">MY ORDERS</h1>
      {fetching ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <Link to="/shop" className="mt-4 inline-block text-primary">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {o.tracking_number && (
                    <p className="font-display text-lg tracking-wider text-primary">{o.tracking_number}</p>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="mt-1 text-sm">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl">₹{Number(o.total).toFixed(0)}</p>
                  <span className="mt-1 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                    {o.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                {o.order_items?.map((it, i) => (
                  <p key={i}>• {it.product_name} × {it.quantity} ({it.size})</p>
                ))}
              </div>
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                Payment: {o.payment_method.toUpperCase()} · Ship to {o.customer_name}, {o.city}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
