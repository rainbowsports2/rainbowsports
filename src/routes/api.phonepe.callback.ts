import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";

const PHONEPE_HOST_UAT = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const PHONEPE_HOST_PROD = "https://api.phonepe.com/apis/hermes";

function getCfg() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID!;
  const saltKey = process.env.PHONEPE_SALT_KEY!;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
  const env = (process.env.PHONEPE_ENV || "UAT").toUpperCase();
  return {
    merchantId,
    saltKey,
    saltIndex,
    host: env === "PROD" ? PHONEPE_HOST_PROD : PHONEPE_HOST_UAT,
  };
}

function xVerify(base: string, saltKey: string, saltIndex: string) {
  return `${crypto.createHash("sha256").update(base + saltKey).digest("hex")}###${saltIndex}`;
}

async function resolveAndUpdate(orderId: string) {
  const cfg = getCfg();
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, phonepe_merchant_transaction_id, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.phonepe_merchant_transaction_id) {
    return { status: "failed" as const };
  }

  const path = `/pg/v1/status/${cfg.merchantId}/${order.phonepe_merchant_transaction_id}`;
  const verify = xVerify(path, cfg.saltKey, cfg.saltIndex);

  const res = await fetch(`${cfg.host}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": verify,
      "X-MERCHANT-ID": cfg.merchantId,
    },
  });
  const result = await res.json().catch(() => ({}));

  let newStatus: "paid" | "failed" | "pending" = "pending";
  if (result?.success && result?.code === "PAYMENT_SUCCESS") newStatus = "paid";
  else if (result?.code === "PAYMENT_ERROR" || result?.code === "PAYMENT_DECLINED") newStatus = "failed";

  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: newStatus,
      phonepe_transaction_id: result?.data?.transactionId || null,
      phonepe_response: result,
      status: newStatus === "paid" ? "confirmed" : "pending",
    })
    .eq("id", order.id);

  return { status: newStatus };
}

export const Route = createFileRoute("/api/phonepe/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("order");
        if (!orderId) {
          throw redirect({ to: "/" });
        }
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
