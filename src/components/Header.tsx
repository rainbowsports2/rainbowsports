import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingBag, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-primary shadow-glow">
            <span className="font-display text-lg text-primary-foreground">RS</span>
          </div>
          <span className="font-display text-2xl tracking-wide">RAINBOW<span className="text-primary"> SPORTS</span></span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "!text-foreground" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/shop" className="text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "!text-foreground" }}>
            Shop
          </Link>
          {user && (
            <Link to="/orders" className="text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "!text-foreground" }}>
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 text-sm font-medium uppercase tracking-wider text-accent transition-colors hover:text-accent/80" activeProps={{ className: "!text-foreground" }}>
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Button variant="ghost" size="icon" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }} title="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
