import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { initiateCashfreePayment } from "@/lib/cashfree.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import { BackendUnavailableNotice } from "@/components/BackendUnavailableNotice";
import { isBackendConfigured } from "@/lib/backend";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Rainbow Sports" }] }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Name required").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Valid phone required"),
  address: z.string().trim().min(5, "Address required").max(500),
  city: z.string().trim().min(2, "City required").max(80),
  postal_code: z.string().trim().min(3, "Postal code required").max(15),
  guest_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    guest_email: "",
    notes: "",
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/shop" className="mt-4 inline-block text-primary">Go shop</Link>
      </div>
    );
  }

  if (!isBackendConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <BackendUnavailableNotice title="Checkout unavailable on this deploy" />
      </div>
    );
  }

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const placeOrder = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id ?? null;

      const result = await initiateCashfreePayment({
        data: {
          customer_name: form.customer_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postal_code: form.postal_code,
          guest_email: form.guest_email || null,
          notes: form.notes || null,
          total,
          items,
          user_id: currentUserId,
          origin: window.location.origin,
        },
      });

      if (result.trackingNumber) {
        localStorage.setItem(`rainbowsports_tracking_${result.orderId}`, result.trackingNumber);
      }
      clear();
      toast.success("Redirecting to Cashfree...");

      const cashfree = await loadCashfree({ mode: "production" });
      await cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not place order");
      setSubmitting(false);
    } finally {
      // submitting stays true while Cashfree redirect is in flight
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-5xl">CHECKOUT</h1>
      {!user && (
        <p className="mb-8 text-sm text-muted-foreground">
          Checking out as guest. <Link to="/auth" className="text-primary underline">Sign in</Link> to track your orders later.
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-2xl">DELIVERY DETAILS</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name *</Label>
              <Input id="name" value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 9876543210" />
            </div>
          </div>

          {!user && (
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={form.guest_email} onChange={(e) => update("guest_email", e.target.value)} />
            </div>
          )}

          <div>
            <Label htmlFor="address">Delivery address *</Label>
            <Textarea id="address" rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="zip">Postal code *</Label>
              <Input id="zip" value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>

          <div className="space-y-3">
            <h3 className="font-display text-xl">PAYMENT METHOD</h3>
            <div className="flex w-full items-center gap-3 rounded-md border border-primary bg-primary/5 p-4 shadow-glow">
              <CreditCard className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-bold">Cashfree</p>
                <p className="text-xs text-muted-foreground">Pay securely via UPI, cards, netbanking or wallets.</p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Secure
              </span>
            </div>
          </div>

          <Button onClick={placeOrder} disabled={submitting} size="lg" className="h-14 w-full bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            {submitting ? "Processing..." : "Continue to Cashfree"}
          </Button>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-2xl">ORDER SUMMARY</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">{item.size} · Qty {item.quantity}</p>
                </div>
                <p className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center justify-between font-display text-2xl">
              <span>Total</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Shipping calculated in final confirmation.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
