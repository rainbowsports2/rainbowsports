// Public edge function: Cashfree webhook receiver.
// Verifies HMAC-SHA256 signature: base64(HMAC_SHA256(timestamp + rawBody, secretKey))
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CASHFREE_SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function hmacSha256Base64(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  let bin = "";
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function mapStatus(payload: any): "paid" | "failed" | "pending" {
  const type = String(payload?.type ?? "").toUpperCase();
  const txStatus = String(
    payload?.data?.payment?.payment_status ??
      payload?.data?.order?.order_status ??
      "",
  ).toUpperCase();

  if (type.includes("PAYMENT_SUCCESS") || txStatus === "SUCCESS" || txStatus === "PAID") return "paid";
  if (
    type.includes("PAYMENT_FAILED") ||
    type.includes("PAYMENT_USER_DROPPED") ||
    ["FAILED", "USER_DROPPED", "CANCELLED", "EXPIRED"].includes(txStatus)
  ) return "failed";
  return "pending";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";

  if (!signature || !timestamp) {
    return new Response("Missing signature", { status: 401 });
  }

  const expected = await hmacSha256Base64(CASHFREE_SECRET_KEY, timestamp + rawBody);
  if (!safeEqual(expected, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const cfOrderId =
    payload?.data?.order?.order_id ??
    payload?.data?.payment?.order_id ??
    payload?.order?.order_id;

  if (!cfOrderId) {
    return Response.json({ ok: true, ignored: true });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("cashfree_order_id", cfOrderId)
    .maybeSingle();

  if (!order) return Response.json({ ok: true, unknown_order: true });
  if (order.payment_status === "paid") {
    return Response.json({ ok: true, already_paid: true });
  }

  const newStatus = mapStatus(payload);

  await supabase
    .from("orders")
    .update({
      payment_status: newStatus,
      cashfree_response: payload,
      status: newStatus === "paid" ? "confirmed" : "pending",
    })
    .eq("id", order.id);

  return Response.json({ ok: true, status: newStatus });
});