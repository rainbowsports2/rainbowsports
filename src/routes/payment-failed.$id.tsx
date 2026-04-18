import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { switchOrderToCod, checkPhonePeStatus } from "@/lib/phonepe.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/payment-failed/$id")({
  head: () => ({ meta: [{ title: "Payment failed — Rainbow Sports" }] }),
  component: PaymentFailed,
});

function PaymentFailed() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"cod" | "retry" | null>(null);

  const switchToCod = async () => {
    setBusy("cod");
    try {
      const r = await switchOrderToCod({ data: { orderId: id } });
      if (r.trackingNumber) {
        localStorage.setItem(`rainbowsports_tracking_${r.orderId}`, r.trackingNumber);
      }
      toast.success("Switched to Cash on Delivery");
      navigate({ to: "/order-success/$id", params: { id: r.orderId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not switch to COD");
    } finally {
      setBusy(null);
    }
  };

  const recheck = async () => {
    setBusy("retry");
    try {
      const r = await checkPhonePeStatus({ data: { orderId: id } });
      if (r.status === "paid") {
        toast.success("Payment confirmed!");
        navigate({ to: "/order-success/$id", params: { id } });
      } else {
        toast.error(`Status: ${r.status}`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not recheck");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
        <XCircle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="mt-6 font-display text-5xl">PAYMENT FAILED</h1>
      <p className="mt-3 text-muted-foreground">
        Your PhonePe payment didn't go through. You can retry, recheck the status, or place this as a Cash on Delivery order instead.
      </p>

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={recheck}
          disabled={busy !== null}
          variant="outline"
          className="font-bold uppercase tracking-wider"
        >
          {busy === "retry" ? "Checking..." : "Recheck payment status"}
        </Button>
        <Button
          onClick={switchToCod}
          disabled={busy !== null}
          className="bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow"
        >
          {busy === "cod" ? "Switching..." : "Place as Cash on Delivery"}
        </Button>
      </div>

      <div className="mt-6">
        <Link to="/cart" className="text-sm text-muted-foreground underline">
          Back to cart
        </Link>
      </div>
    </div>
  );
}
