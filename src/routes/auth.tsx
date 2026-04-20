import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BackendUnavailableNotice } from "@/components/BackendUnavailableNotice";
import { isBackendConfigured } from "@/lib/backend";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Rainbow Sports" }] }),
  component: Auth,
});

const emailSchema = z.string().trim().email().max(255);
const pwSchema = z.string().min(6).max(72);

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();

  const isBannedError = (msg: string) =>
    /banned|blocked|disabled/i.test(msg);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBackendConfigured) return toast.error("Authentication is unavailable on this deploy");
    if (!emailSchema.safeParse(email).success) return toast.error("Enter a valid email");
    if (!pwSchema.safeParse(password).success) return toast.error("Password must be 6+ characters");

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: "/" });
    } catch (e: any) {
      const msg = e?.message ?? "Auth failed";
      toast.error(isBannedError(msg) ? "This account has been blocked. Contact support." : msg);
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    if (!isBackendConfigured) return toast.error("Password reset is unavailable on this deploy");
    if (!emailSchema.safeParse(email).success)
      return toast.error("Enter your account email above first");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent. Check your inbox.");
      setForgotOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (!isBackendConfigured) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <BackendUnavailableNotice title="Sign in unavailable on this deploy" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl">{mode === "signin" ? "SIGN IN" : "JOIN"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signin" ? "Welcome back to Rainbow Sports." : "Create an account to track orders."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <Button type="submit" disabled={loading} size="lg" className="h-12 w-full bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
          {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setForgotOpen((v) => !v)}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>

        {forgotOpen && mode === "signin" && (
          <div className="rounded-md border border-border bg-background/40 p-3 text-sm">
            <p className="text-muted-foreground">
              We'll email <span className="text-foreground">{email || "your address"}</span> a password reset link.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={sendReset}
              className="mt-3 w-full"
            >
              Send reset link
            </Button>
          </div>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Or <Link to="/shop" className="text-primary hover:underline">continue as guest</Link>
      </p>
    </div>
  );
}
