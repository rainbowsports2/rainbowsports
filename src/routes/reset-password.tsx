import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Rainbow Sports" }] }),
  component: ResetPassword,
});

const pwSchema = z.string().min(6).max(72);

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash and exchanges it
    // automatically via onAuthStateChange. Wait for a session to appear.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwSchema.safeParse(password).success)
      return toast.error("Password must be 6+ characters");
    if (password !== confirm) return toast.error("Passwords don't match");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl">RESET PASSWORD</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {ready
          ? "Choose a new password to finish."
          : "Verifying your reset link..."}
      </p>

      {ready && (
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="h-12 w-full bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow"
          >
            {loading ? "..." : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
