import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof STATUSES)[number];
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type Order = {
  id: string;
  tracking_number: string | null;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  total: number;
  status: OrderStatus;
  payment_method: "cod" | "phonepe";
  payment_status: PaymentStatus;
  phonepe_transaction_id: string | null;
  phonepe_merchant_transaction_id: string | null;
  notes: string | null;
  guest_email: string | null;
  user_id: string | null;
  order_items: { product_name: string; quantity: number; size: string; unit_price: number }[];
};

const paymentBadge: Record<PaymentStatus, string> = {
  paid: "border-green-500/50 bg-green-500/10 text-green-400",
  pending: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  failed: "border-destructive/50 bg-destructive/10 text-destructive",
  refunded: "border-blue-500/50 bg-blue-500/10 text-blue-400",
};

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "cod" | "phonepe">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, size, unit_price)")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const counts = useMemo(
    () => ({
      all: orders.length,
      cod: orders.filter((o) => o.payment_method === "cod").length,
      phonepe: orders.filter((o) => o.payment_method === "phonepe").length,
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter((o) => o.payment_method === tab);
  }, [orders, tab]);

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl">ORDERS</h2>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="cod">COD ({counts.cod})</TabsTrigger>
          <TabsTrigger value="phonepe">PhonePe ({counts.phonepe})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground">No orders here yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((o) => (
                <OrderCard key={o.id} o={o} onUpdate={updateStatus} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({
  o,
  onUpdate,
}: {
  o: Order;
  onUpdate: (id: string, status: OrderStatus) => void;
}) {
  const isOnline = o.payment_method === "phonepe";
  return (
    <div
      className={`rounded-lg border bg-card p-5 ${
        isOnline ? "border-primary/40 shadow-glow" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {o.tracking_number && (
            <p className="font-display text-lg tracking-wider text-primary">{o.tracking_number}</p>
          )}
          <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
          <p className="mt-1 font-display text-xl">{o.customer_name}</p>
          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl">₹{Number(o.total).toFixed(0)}</p>
          <div className="mt-1 flex flex-wrap items-center justify-end gap-1">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isOnline
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-accent/50 bg-accent/10 text-accent"
              }`}
            >
              {isOnline ? "PhonePe" : "COD"}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${paymentBadge[o.payment_status]}`}
            >
              {o.payment_status}
            </span>
          </div>
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
          <p className="text-muted-foreground">
            {o.city} – {o.postal_code}
          </p>
        </div>
      </div>

      {isOnline && (o.phonepe_transaction_id || o.phonepe_merchant_transaction_id) && (
        <div className="mt-3 rounded border border-border bg-background/40 p-3 text-xs">
          <p className="uppercase tracking-wider text-muted-foreground">PhonePe transaction</p>
          {o.phonepe_transaction_id && (
            <p className="mt-1 font-mono">PhonePe Txn ID: {o.phonepe_transaction_id}</p>
          )}
          {o.phonepe_merchant_transaction_id && (
            <p className="font-mono text-muted-foreground">Merchant Ref: {o.phonepe_merchant_transaction_id}</p>
          )}
        </div>
      )}

      <div className="mt-4 rounded border border-border bg-background/40 p-3 text-sm">
        {o.order_items?.map((it, i) => (
          <div key={i} className="flex justify-between">
            <span>
              {it.product_name} <span className="text-muted-foreground">× {it.quantity} ({it.size})</span>
            </span>
            <span>₹{(Number(it.unit_price) * it.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>

      {o.notes && <p className="mt-3 text-xs italic text-muted-foreground">Note: {o.notes}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onUpdate(o.id, s)}
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
  );
}
