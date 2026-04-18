import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order-success/$id")({
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 shadow-glow">
        <CheckCircle2 className="h-12 w-12 text-accent" />
      </div>
      <h1 className="mt-6 font-display text-5xl">ORDER PLACED!</h1>
      <p className="mt-3 text-muted-foreground">
        Thanks for your purchase. We'll contact you shortly to confirm delivery.
      </p>
      <p className="mt-4 rounded-md border border-border bg-card px-4 py-3 font-mono text-xs">
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
