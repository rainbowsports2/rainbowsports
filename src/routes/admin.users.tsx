import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import { listUsers, setUserBlocked, type AdminUser } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { users } = await listUsers();
      setUsers(users);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      await setUserBlocked({ data: { targetUserId: u.id, block: !u.is_blocked } });
      toast.success(u.is_blocked ? "User unblocked" : "User blocked");
      setUsers((arr) =>
        arr.map((x) => (x.id === u.id ? { ...x, is_blocked: !u.is_blocked } : x)),
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl">USERS</h2>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">No users yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 ${
                u.is_blocked ? "border-destructive/40" : "border-border"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-lg">
                    {u.full_name || u.email || "Unknown"}
                  </p>
                  {u.is_blocked && (
                    <span className="rounded-full border border-destructive/50 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u.order_count} order{u.order_count === 1 ? "" : "s"} · Joined{" "}
                  {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>

              <Button
                variant={u.is_blocked ? "outline" : "destructive"}
                size="sm"
                disabled={busyId === u.id}
                onClick={() => toggle(u)}
              >
                {busyId === u.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : u.is_blocked ? (
                  <>
                    <ShieldOff className="mr-2 h-4 w-4" /> Unblock
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" /> Block
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
