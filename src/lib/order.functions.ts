import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const guestOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().min(3).max(15),
  guest_email: z.string().trim().email().max(255).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  total: z.number().finite().nonnegative(),
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
});

export const createGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => guestOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: null,
        guest_email: data.guest_email || null,
        customer_name: data.customer_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        notes: data.notes || null,
        total: data.total,
        payment_method: "cod",
        status: "pending",
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
      throw new Error(itemsError.message || "Could not save order items");
    }

    return {
      id: order.id,
      trackingNumber: order.tracking_number,
    };
  });
