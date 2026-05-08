import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CASHFREE_HOST_PROD = "https://api.cashfree.com/pg";
const CASHFREE_HOST_SANDBOX = "https://sandbox.cashfree.com/pg";
const CASHFREE_API_VERSION = "2023-08-01";

function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const env = (process.env.CASHFREE_ENV || "PROD").toUpperCase();
  if (!appId || !secretKey) {
    throw new Error("Cashfree is not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY.");
  }
  return {
    appId,
    secretKey,
    host: env === "SANDBOX" ? CASHFREE_HOST_SANDBOX : CASHFREE_HOST_PROD,
  };
}

function cfHeaders(cfg: { appId: string; secretKey: string }) {
  return {
    "Content-Type": "application/json",
    accept: "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": cfg.appId,
    "x-client-secret": cfg.secretKey,
  };
}

const initiateSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().min(3).max(15),
  guest_email: z.string().trim().email().max(255).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  total: z.number().finite().positive(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        name: z.string().trim().min(1).max(200),
        size: z.string().trim().min(1).max(20),
        quantity: z.number().int().min(1).max(20),
        price: z.number().finite().nonnegative(),
      }),
    )
    .min(1)
    .max(50),
  user_id: z.string().uuid().optional().nullable(),
  origin: z.string().url(),
});

export const initiateCashfreePayment = createServerFn({ method: "POST" })
  .inputValidator((input) => initiateSchema.parse(input))
  .handler(async ({ data }) => {
    const cfg = getCashfreeConfig();

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: data.user_id || null,
        guest_email: data.guest_email || null,
        customer_name: data.customer_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        notes: data.notes || null,
        total: data.total,
        payment_method: "cashfree",
        status: "pending",
        payment_status: "pending",
      })
      .select("id, tracking_number")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || "Could not create order");
    }

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      data.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.price,
      })),
    );
    if (itemsError) {
      throw new Error(itemsError.message || "Could not save items");
    }

    const cfOrderId = `RS_${order.id.replace(/-/g, "").slice(0, 20)}_${Date.now().toString().slice(-6)}`;
    const customerId = data.user_id
      ? `U${data.user_id.replace(/-/g, "").slice(0, 30)}`
      : `G${order.id.replace(/-/g, "").slice(0, 30)}`;
    const phoneDigits = data.phone.replace(/\D/g, "").slice(-10);

    const payload = {
      order_id: cfOrderId,
      order_amount: Number(data.total.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: data.customer_name,
        customer_email: data.guest_email || "noreply@rainbowsports.in",
        customer_phone: phoneDigits || "9999999999",
      },
      order_meta: {
        return_url: `${data.origin}/api/cashfree/callback?order=${order.id}`,
        notify_url: `${data.origin}/api/cashfree/callback?order=${order.id}`,
      },
      order_note: `Rainbow Sports order ${order.tracking_number || order.id}`,
    };

    const res = await fetch(`${cfg.host}/orders`, {
      method: "POST",
      headers: cfHeaders(cfg),
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result?.payment_session_id) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", cashfree_response: result })
        .eq("id", order.id);
      throw new Error(result?.message || `Cashfree init failed (${res.status})`);
    }

    await supabaseAdmin
      .from("orders")
      .update({
        cashfree_order_id: cfOrderId,
        cashfree_payment_session_id: result.payment_session_id,
        cashfree_response: result,
      })
      .eq("id", order.id);

    return {
      orderId: order.id,
      trackingNumber: order.tracking_number,
      cashfreeOrderId: cfOrderId,
      paymentSessionId: result.payment_session_id as string,
    };
  });

const checkSchema = z.object({ orderId: z.string().uuid() });

export const checkCashfreeStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => checkSchema.parse(input))
  .handler(async ({ data }) => {
    const cfg = getCashfreeConfig();

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, cashfree_order_id, payment_status, tracking_number")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order || !order.cashfree_order_id) {
      throw new Error("Order not found");
    }

    const res = await fetch(`${cfg.host}/orders/${order.cashfree_order_id}`, {
      method: "GET",
      headers: cfHeaders(cfg),
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

    return {
      status: newStatus,
      trackingNumber: order.tracking_number,
    };
  });