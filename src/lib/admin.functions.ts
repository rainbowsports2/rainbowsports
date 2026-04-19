import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  is_blocked: boolean;
  banned_until: string | null;
  order_count: number;
};

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    await ensureAdmin(supabase, userId);

    // Use admin client to list auth users + read profiles
    const { data: authList, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authErr) throw new Error(authErr.message);

    const userIds = authList.users.map((u) => u.id);

    const [{ data: profiles }, { data: orderRows }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, phone, is_blocked")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin
        .from("orders")
        .select("user_id")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.user_id as string, p]),
    );
    const orderCount = new Map<string, number>();
    for (const r of orderRows ?? []) {
      const id = (r as any).user_id as string | null;
      if (!id) continue;
      orderCount.set(id, (orderCount.get(id) ?? 0) + 1);
    }

    const users: AdminUser[] = authList.users.map((u) => {
      const p = profileMap.get(u.id) as any;
      return {
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        full_name: p?.full_name ?? null,
        phone: p?.phone ?? null,
        is_blocked: !!p?.is_blocked,
        banned_until: (u as any).banned_until ?? null,
        order_count: orderCount.get(u.id) ?? 0,
      };
    });

    users.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return { users };
  });

const blockSchema = z.object({
  targetUserId: z.string().uuid(),
  block: z.boolean(),
});

export const setUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => blockSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    await ensureAdmin(supabase, userId);

    if (data.targetUserId === userId) {
      throw new Error("You cannot block yourself.");
    }

    // Soft flag in profiles
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_blocked: data.block })
      .eq("user_id", data.targetUserId);
    if (profErr) throw new Error(profErr.message);

    // Hard auth ban: set ban_duration to a very long time, or 'none' to clear
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
      data.targetUserId,
      { ban_duration: data.block ? "876000h" : "none" }, // ~100 years
    );
    if (authErr) throw new Error(authErr.message);

    return { success: true };
  });
