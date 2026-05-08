import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CASHFREE_HOST_PROD = "https://api.cashfree.com/pg";
const CASHFREE_HOST_SANDBOX = "https://sandbox.cashfree.com/pg";

function getCfg() {
  const env = (process.env.CASHFREE_ENV || "PROD").toUpperCase();
  return {
    appId: process.env.CASHFREE_APP_ID!,
    secretKey: process.env.CASHFREE_SECRET_KEY!,
    host: env === "SANDBOX" ? CASHFREE_HOST_SANDBOX : CASHFREE_HOST_PROD,
  };
}

async function resolveAndUpdate(orderId: string) {
  const cfg = getCfg();
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, cashfree_order_id, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.cashfree_order_id) return { status: "failed" as const };

  const res = await fetch(`${cfg.host}/orders/${order.cashfree_order_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": cfg.appId,
      "x-client-secret": cfg.secretKey,
    },
  });
  const result = await res.json().catch(() => ({}));

  const cfStatus = String(result?.order_status || "").toUpperCase();
  let newStatus: "paid" | "failed" | "pending" = "pending";
  if (cfStatus === "PAID") newStatus = "paid";
  else if (cfStatus === "EXPIRED" || cfStatus === "TERMINATED" || cfStatus === "CANCELLED") newStatus = "failed";

  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: newStatus,
      cashfree_response: result,
      status: newStatus === "paid" ? "confirmed" : "pending",
    })
    .eq("id", order.id);

  return { status: newStatus };
}

export const Route = createFileRoute("/api/cashfree/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("order");
        if (!orderId) throw redirect({ to: "/" });
        const { status } = await resolveAndUpdate(orderId);
        if (status === "paid") {
          throw redirect({ to: "/order-success/$id", params: { id: orderId } });
        }
        throw redirect({ to: "/payment-failed/$id", params: { id: orderId } });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("order");
        if (!orderId) return new Response("missing order", { status: 400 });
        await resolveAndUpdate(orderId);
        return Response.json({ ok: true });
      },
    },
  },
});