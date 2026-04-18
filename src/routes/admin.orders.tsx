import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  total: number;
  status: typeof STATUSES[number];
  payment_method: string;
  notes: string | null;
  guest_email: string | null;
  user_id: string | null;
  order_items: { product_name: string; quantity: number; size: string; unit_price: number }[];
};

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, size, unit_price)")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: typeof STATUSES[number]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl">ORDERS</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="mt-1 font-display text-xl">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl">₹{Number(o.total).toFixed(0)}</p>
                  <p className="text-xs uppercase tracking-wider text-accent">{o.payment_method}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Contact</p>
                  <p>{o.phone}</p>
                  {o.guest_email && <p className="text-muted-foreground">{o.guest_email}</p>}
                  {!o.user_id && <p className="text-xs text-accent">Guest order</p>}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery</p>
                  <p>{o.address}</p>
                  <p className="text-muted-foreground">{o.city} – {o.postal_code}</p>
                </div>
              </div>

              <div className="mt-4 rounded border border-border bg-background/40 p-3 text-sm">
                {o.order_items?.map((it, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{it.product_name} <span className="text-muted-foreground">× {it.quantity} ({it.size})</span></span>
                    <span>₹{(Number(it.unit_price) * it.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {o.notes && <p className="mt-3 text-xs italic text-muted-foreground">Note: {o.notes}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(o.id, s)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      o.status === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
