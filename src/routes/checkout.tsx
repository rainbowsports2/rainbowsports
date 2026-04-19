import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { createGuestOrder } from "@/lib/order.functions";
import { initiatePhonePePayment } from "@/lib/phonepe.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Smartphone, Wallet, QrCode, Copy } from "lucide-react";
import bharatpeQr from "@/assets/bharatpe-qr.jpg";

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

type PaymentChoice = "cod" | "phonepe" | "bharatpe";

const BHARATPE_UPI = "BHARATPE09900343083@yesbankltd";
const BHARATPE_PAYEE_NAME = "Rainbow Sports";

function Checkout() {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentChoice>("cod");

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

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const upiLink = `upi://pay?pa=${encodeURIComponent(BHARATPE_UPI)}&pn=${encodeURIComponent(BHARATPE_PAYEE_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Rainbow Sports order")}`;

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(BHARATPE_UPI);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Could not copy");
    }
  };

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

      // PhonePe flow
      if (payment === "phonepe") {
        const result = await initiatePhonePePayment({
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
        toast.success("Redirecting to PhonePe...");
        window.location.href = result.redirectUrl;
        return;
      }

      // BharatPe / UPI manual flow — record order as pending and let user pay via QR/UPI
      const orderNotes = (form.notes ? form.notes + " | " : "") +
        (payment === "bharatpe" ? `Paid via BharatPe UPI (${BHARATPE_UPI})` : "");

      // COD or BharatPe — guest path
      if (!currentUserId) {
        const result = await createGuestOrder({
          data: {
            ...form,
            guest_email: form.guest_email || null,
            notes: orderNotes || null,
            total,
            items,
          },
        });
        if (result.trackingNumber) {
          localStorage.setItem(`rainbowsports_tracking_${result.id}`, result.trackingNumber);
        }
        clear();
        toast.success(payment === "bharatpe" ? "Order placed! Complete UPI payment." : "Order placed!");
        navigate({ to: "/order-success/$id", params: { id: result.id } });
        return;
      }

      // Logged-in COD or BharatPe path
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: currentUserId,
          guest_email: null,
          customer_name: form.customer_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postal_code: form.postal_code,
          notes: orderNotes || null,
          total,
          payment_method: "cod",
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr ?? new Error("Order failed");

      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          size: i.size,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      );
      if (itemsErr) throw itemsErr;

      clear();
      toast.success(payment === "bharatpe" ? "Order placed! Complete UPI payment." : "Order placed!");
      navigate({ to: "/order-success/$id", params: { id: order.id } });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-5xl">CHECKOUT</h1>
      {!user && (
        <p className="mb-8 text-sm text-muted-foreground">
          Checking out as guest.{" "}
          <Link to="/auth" className="text-primary underline">Sign in</Link> to track your orders later.
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
            <button
              type="button"
              onClick={() => setPayment("phonepe")}
              className={`flex w-full items-center gap-3 rounded-md border p-4 text-left transition ${
                payment === "phonepe"
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Smartphone className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-bold">PhonePe</p>
                <p className="text-xs text-muted-foreground">Pay instantly via UPI / cards / wallet.</p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Online
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPayment("bharatpe")}
              className={`flex w-full items-center gap-3 rounded-md border p-4 text-left transition ${
                payment === "bharatpe"
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <QrCode className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-bold">BharatPe / UPI</p>
                <p className="text-xs text-muted-foreground">Scan QR or pay to UPI ID — any UPI app.</p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                UPI
              </span>
            </button>

            {payment === "bharatpe" && (
              <div className="rounded-md border border-border bg-background p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                  <img
                    src={bharatpeQr}
                    alt="BharatPe UPI QR code for Rainbow Sports"
                    className="mx-auto w-44 rounded-md border border-border bg-white"
                  />
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">UPI ID</p>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-xs">{BHARATPE_UPI}</code>
                        <Button type="button" size="sm" variant="outline" onClick={copyUpi}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
                      <p className="font-display text-lg">₹{total.toFixed(0)}</p>
                    </div>
                    <a
                      href={upiLink}
                      className="inline-flex w-full items-center justify-center rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 sm:w-auto"
                    >
                      Open UPI app
                    </a>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Scan the QR or pay to the UPI ID. After paying, click <b>Place order</b> below — we'll confirm payment manually.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPayment("cod")}
              className={`flex w-full items-center gap-3 rounded-md border p-4 text-left transition ${
                payment === "cod"
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wallet className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-bold">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">Pay in cash when your jersey arrives.</p>
              </div>
              <CheckCircle2 className={`h-4 w-4 ${payment === "cod" ? "text-primary" : "text-transparent"}`} />
            </button>
          </div>
        </div>

        <div className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-2xl">ORDER</h2>
          <div className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <div key={`${i.productId}-${i.size}`} className="flex justify-between gap-2">
                <span>{i.name} <span className="text-muted-foreground">× {i.quantity} ({i.size})</span></span>
                <span>₹{(i.price * i.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="my-4 border-t border-border" />
          <div className="flex justify-between font-display text-2xl">
            <span>Total</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
          <Button
            onClick={placeOrder}
            disabled={submitting}
            size="lg"
            className="mt-6 h-12 w-full bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow"
          >
            {submitting
              ? "Processing..."
              : payment === "phonepe"
                ? "Pay with PhonePe"
                : payment === "bharatpe"
                  ? "I've paid — Place order"
                  : "Place order (COD)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
