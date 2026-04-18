import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/order-success/$id")({
  head: () => ({ meta: [{ title: "Order placed — Rainbow Sports" }] }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id } = Route.useParams();
  const [tracking, setTracking] = useState<string | null>(null);

  useEffect(() => {
    const cachedTracking =
      typeof window !== "undefined"
        ? localStorage.getItem(`rainbowsports_tracking_${id}`)
        : null;

    if (cachedTracking) {
      setTracking(cachedTracking);
      return;
    }

    supabase
      .from("orders")
      .select("tracking_number")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setTracking(data?.tracking_number ?? null));
  }, [id]);

  const copy = () => {
    if (!tracking) return;
    navigator.clipboard.writeText(tracking);
    toast.success("Tracking number copied");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 shadow-glow">
        <CheckCircle2 className="h-12 w-12 text-accent" />
      </div>
      <h1 className="mt-6 font-display text-5xl">ORDER PLACED!</h1>
      <p className="mt-3 text-muted-foreground">
        Thanks for your purchase. We'll contact you shortly to confirm delivery.
      </p>

      {tracking && (
        <div className="mt-6 rounded-lg border border-primary/40 bg-primary/5 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Your tracking number</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="font-display text-3xl tracking-wider text-primary">{tracking}</p>
            <button onClick={copy} className="rounded p-2 text-muted-foreground hover:text-foreground" aria-label="Copy tracking">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Save this number to track your order.</p>
        </div>
      )}

      <p className="mt-4 rounded-md border border-border bg-card px-4 py-3 font-mono text-xs text-muted-foreground">
        Order ID: {id}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/shop">
          <Button variant="outline" className="font-bold uppercase tracking-wider">Keep shopping</Button>
        </Link>
        <Link to="/">
          <Button className="bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
