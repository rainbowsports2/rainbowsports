import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Package, ShoppingCart, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Rainbow Sports" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl">Admin only</h1>
        <p className="mt-2 text-muted-foreground">Please sign in.</p>
        <Link to="/auth" className="mt-4 inline-block text-primary">Sign in</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl">Not an admin</h1>
        <p className="mt-2 text-muted-foreground">
          Your account has no admin role yet. To grant yourself admin access, run this in the
          Lovable Cloud SQL editor (replacing the email):
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-card p-4 text-left font-mono text-xs">
{`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com';`}
        </pre>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-5xl">ADMIN</h1>
      </div>
      <nav className="mb-8 flex gap-2 border-b border-border">
        <AdminTab to="/admin" icon={<Package className="h-4 w-4" />} label="Products" exact />
        <AdminTab to="/admin/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Orders" />
        <AdminTab to="/admin/users" icon={<Users className="h-4 w-4" />} label="Users" />
      </nav>
      <Outlet />
    </div>
  );
}

function AdminTab({ to, icon, label, exact }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: !!exact }}
      className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      activeProps={{ className: "!border-primary !text-foreground" }}
    >
      {icon} {label}
    </Link>
  );
}
