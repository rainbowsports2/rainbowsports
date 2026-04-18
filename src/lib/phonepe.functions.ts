import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PHONEPE_HOST_UAT = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const PHONEPE_HOST_PROD = "https://api.phonepe.com/apis/hermes";

function getPhonepeConfig() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
  const env = (process.env.PHONEPE_ENV || "UAT").toUpperCase();

  if (!merchantId || !saltKey) {
    throw new Error("PhonePe is not configured. Add PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY.");
  }
  return {
    merchantId,
    saltKey,
    saltIndex,
    host: env === "PROD" ? PHONEPE_HOST_PROD : PHONEPE_HOST_UAT,
  };
}

function buildXVerify(payloadBase64: string, path: string, saltKey: string, saltIndex: string) {
  const sha = crypto
    .createHash("sha256")
    .update(payloadBase64 + path + saltKey)
    .digest("hex");
  return `${sha}###${saltIndex}`;
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

export const initiatePhonePePayment = createServerFn({ method: "POST" })
  .inputValidator((input) => initiateSchema.parse(input))
  .handler(async ({ data }) => {
    const cfg = getPhonepeConfig();

    // Create the order in DB first with status pending
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
        payment_method: "phonepe",
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

    const merchantTransactionId = `MT${order.id.replace(/-/g, "").slice(0, 20)}${Date.now().toString().slice(-6)}`.slice(0, 35);

    await supabaseAdmin
      .from("orders")
      .update({ phonepe_merchant_transaction_id: merchantTransactionId })
      .eq("id", order.id);

    const payload = {
      merchantId: cfg.merchantId,
      merchantTransactionId,
      merchantUserId: data.user_id ? `U${data.user_id.replace(/-/g, "").slice(0, 20)}` : `G${Date.now()}`,
      amount: Math.round(data.total * 100), // paise
      redirectUrl: `${data.origin}/api/phonepe/callback?order=${order.id}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${data.origin}/api/phonepe/callback?order=${order.id}`,
      mobileNumber: data.phone.replace(/\D/g, "").slice(-10),
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const path = "/pg/v1/pay";
    const xVerify = buildXVerify(payloadBase64, path, cfg.saltKey, cfg.saltIndex);

    const res = await fetch(`${cfg.host}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({ request: payloadBase64 }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result?.success) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", phonepe_response: result })
        .eq("id", order.id);
      throw new Error(result?.message || `PhonePe init failed (${res.status})`);
    }

    const redirectUrl = result?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      throw new Error("PhonePe did not return a redirect URL");
    }

    return {
      orderId: order.id,
      trackingNumber: order.tracking_number,
      merchantTransactionId,
      redirectUrl,
    };
  });

const checkSchema = z.object({
  orderId: z.string().uuid(),
});

export const checkPhonePeStatus = createServerFn({ method: "POST" })
  .inputValidator((input) => checkSchema.parse(input))
  .handler(async ({ data }) => {
    const cfg = getPhonepeConfig();

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, phonepe_merchant_transaction_id, payment_status, tracking_number")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order || !order.phonepe_merchant_transaction_id) {
      throw new Error("Order not found");
    }

    const path = `/pg/v1/status/${cfg.merchantId}/${order.phonepe_merchant_transaction_id}`;
    const xVerify = buildXVerify("", path, cfg.saltKey, cfg.saltIndex);

    const res = await fetch(`${cfg.host}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-VERIFY": xVerify,
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

    return {
      status: newStatus,
      trackingNumber: order.tracking_number,
    };
  });

const switchSchema = z.object({
  orderId: z.string().uuid(),
});

export const switchOrderToCod = createServerFn({ method: "POST" })
  .inputValidator((input) => switchSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_method: "cod",
        payment_status: "pending",
        status: "pending",
      })
      .eq("id", data.orderId)
      .select("id, tracking_number")
      .single();

    if (error || !order) throw new Error(error?.message || "Could not switch to COD");

    return { orderId: order.id, trackingNumber: order.tracking_number };
  });
