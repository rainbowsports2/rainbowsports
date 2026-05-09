import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function verifySignature(timestamp: string, rawBody: string, signature: string) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return false;
  const computed = createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");
  try {
    const a = Buffer.from(computed);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function mapStatus(payload: any): "paid" | "failed" | "pending" {
  const type = String(payload?.type || "").toUpperCase();
  const txStatus = String(
    payload?.data?.payment?.payment_status ||
      payload?.data?.order?.order_status ||
      "",
  ).toUpperCase();

  if (type.includes("PAYMENT_SUCCESS") || txStatus === "SUCCESS" || txStatus === "PAID") {
    return "paid";
  }
  if (
    type.includes("PAYMENT_FAILED") ||
    type.includes("PAYMENT_USER_DROPPED") ||
    txStatus === "FAILED" ||
    txStatus === "USER_DROPPED" ||
    txStatus === "CANCELLED" ||
    txStatus === "EXPIRED"
  ) {
    return "failed";
  }
  return "pending";
}

export const Route = createFileRoute("/api/public/cashfree/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-webhook-signature") || "";
        const timestamp = request.headers.get("x-webhook-timestamp") || "";

        if (!signature || !timestamp || !verifySignature(timestamp, rawBody, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const cfOrderId =
          payload?.data?.order?.order_id ||
          payload?.data?.payment?.order_id ||
          payload?.order?.order_id;

        if (!cfOrderId) {
          return Response.json({ ok: true, ignored: true });
        }

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, payment_status")
          .eq("cashfree_order_id", cfOrderId)
          .maybeSingle();

        if (!order) {
          return Response.json({ ok: true, unknown_order: true });
        }

        // Don't downgrade an already-paid order
        if (order.payment_status === "paid") {
          return Response.json({ ok: true, already_paid: true });
        }

        const newStatus = mapStatus(payload);

        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: newStatus,
            cashfree_response: payload,
            status: newStatus === "paid" ? "confirmed" : "pending",
          })
          .eq("id", order.id);

        return Response.json({ ok: true, status: newStatus });
      },
    },
  },
});