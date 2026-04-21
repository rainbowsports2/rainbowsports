import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-display text-2xl tracking-wide">
            JERSEY<span className="text-primary">HUB</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Premium sports jerseys. Cash on Delivery available across India.
          </p>
          <div className="flex flex-col items-center gap-1 md:items-end">
            <Link to="/policies" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
              Return, Refund &amp; Privacy Policy
            </Link>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Rainbow Sports</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
