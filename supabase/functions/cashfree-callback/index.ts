// Public edge function: handles Cashfree return_url redirect.
// Verifies order status with Cashfree, updates DB, then 302s the
// shopper back to the frontend success/failed page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CASHFREE_APP_ID = Deno.env.get("CASHFREE_APP_ID")!;
const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY")!;
const CASHFREE_ENV = (Deno.env.get("CASHFREE_ENV") ?? "PROD").toUpperCase();
const FRONTEND_URL = (Deno.env.get("FRONTEND_URL") ?? "https://rainbowsports.lovable.app").replace(/\/$/, "");

const CF_HOST = CASHFREE_ENV === "SANDBOX"
  ? "https://sandbox.cashfree.com/pg"
  : "https://api.cashfree.com/pg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function redirect(to: string) {
  return new Response(null, { status: 302, headers: { Location: to } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order");
    if (!orderId) return redirect(FRONTEND_URL + "/");

    const { data: order } = await supabase
      .from("orders")
      .select("id, cashfree_order_id, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (!order?.cashfree_order_id) {
      return redirect(`${FRONTEND_URL}/payment-failed/${orderId}`);
    }

    const cfRes = await fetch(`${CF_HOST}/orders/${order.cashfree_order_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
    });
    const result = await cfRes.json().catch(() => ({}));

    const cfStatus = String(result?.order_status ?? "").toUpperCase();
    let newStatus: "paid" | "failed" | "pending" = "pending";
    if (cfStatus === "PAID") newStatus = "paid";
    else if (["EXPIRED", "TERMINATED", "CANCELLED"].includes(cfStatus)) newStatus = "failed";

    // Don't downgrade an order that webhooks already marked paid
    const finalStatus = order.payment_status === "paid" ? "paid" : newStatus;

    await supabase
      .from("orders")
      .update({
        payment_status: finalStatus,
        cashfree_response: result,
        status: finalStatus === "paid" ? "confirmed" : "pending",
      })
      .eq("id", order.id);

    if (finalStatus === "paid") {
      return redirect(`${FRONTEND_URL}/order-success/${order.id}`);
    }
    return redirect(`${FRONTEND_URL}/payment-failed/${order.id}`);
  } catch (err) {
    console.error("cashfree-callback error", err);
    return redirect(FRONTEND_URL + "/");
  }
});