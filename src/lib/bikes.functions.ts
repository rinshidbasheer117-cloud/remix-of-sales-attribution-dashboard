import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const [roles, profile, staff] = await Promise.all([
      db.from("user_roles").select("role").eq("user_id", context.userId),
      db.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      db.from("employees").select("*").order("name"),
    ]);
    for (const result of [roles, profile, staff])
      if (result.error) throw new Error("Your workspace could not be loaded. Please try again.");
    const operator =
      roles.data?.some((r) => r.role === "admin" || r.role === "operations") ?? false;
    const [stock, ledger, events] = await Promise.all([
      db.from("bikes").select("*").order("created_at", { ascending: false }),
      db.from("commissions").select("*"),
      db.from("bike_events").select("*").order("created_at"),
    ]);
    if (operator && (stock.error || ledger.error || events.error))
      throw new Error("Bike records could not be loaded. Please try again.");
    const bikes = await Promise.all(
      (stock.data ?? []).map(async (bike) => {
        if (bike.intake_photo && bike.intake_photo.includes(".."))
          throw new Error("Invalid file path");
        if (bike.listing_photo && bike.listing_photo.includes(".."))
          throw new Error("Invalid file path");
        const [intake, listing] = await Promise.all([
          bike.intake_photo
            ? db.storage.from("bike-photos").createSignedUrl(bike.intake_photo, 300)
            : null,
          bike.listing_photo
            ? db.storage.from("bike-photos").createSignedUrl(bike.listing_photo, 300)
            : null,
        ]);
        return {
          ...bike,
          intakeUrl: intake?.data?.signedUrl ?? null,
          listingUrl: listing?.data?.signedUrl ?? null,
        };
      }),
    );
    return {
      operator,
      admin: roles.data?.some((r) => r.role === "admin") ?? false,
      profile: profile.data,
      employees: staff.data ?? [],
      bikes,
      commissions: ledger.data ?? [],
      events: events.data ?? [],
    };
  });

export const intakeBike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ payload: z.record(z.string(), z.union([z.string(), z.number(), z.null()])) }),
  )
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("intake_bike", {
      payload: data.payload,
      historical: false,
    });
    if (result.error)
      throw new Error(
        result.error.code === "23505"
          ? "This SKU is already in your inventory."
          : result.error.message,
      );
    return result.data;
  });
export const advanceBike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      bike: z.string().uuid(),
      expected_status: z.string(),
      payload: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
    }),
  )
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("advance_bike", { ...data, historical: false });
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });
export const setPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pin: z.string().regex(/^\d{6}$/) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("set_my_pin", data);
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });
export const unlockPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ pin: z.string().regex(/^\d{6}$/) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("unlock_portal", data);
    if (result.error) throw new Error(result.error.message);
    const value = result.data as { token?: string; error?: string };
    if (!value.token) throw new Error(value.error ?? "Could not unlock");
    return { token: value.token };
  });
export type PortalCommission = {
  id: string;
  bike_id: string;
  allocation_role: string;
  amount: number;
  stock_days: number;
  zone: string;
  sku: string;
  brand: string;
  model: string;
  sold_date: string;
  sale_price: number;
  photo: string | null;
  photoUrl?: string | null;
};
export type PortalBike = {
  id: string;
  sku: string;
  brand: string;
  model: string;
  status: string;
  photo: string | null;
  photoUrl?: string | null;
  sold_date: string | null;
  service_date: string | null;
};
export const getPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("my_portal", data);
    if (result.error) throw new Error("Your private page is locked. Enter your passcode again.");
    const portal = result.data as {
      employee: { id: string; name: string; job_title: string };
      commissions: PortalCommission[];
      bikes: PortalBike[];
    };
    // A validated employee-scoped token has already restricted every returned record.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sign = async (photo: string | null) => {
      if (photo && photo.includes("..")) throw new Error("Invalid file path");
      return photo
        ? ((await supabaseAdmin.storage.from("bike-photos").createSignedUrl(photo, 180)).data
            ?.signedUrl ?? null)
        : null;
    };
    return {
      ...portal,
      commissions: await Promise.all(
        portal.commissions.map(async (row) => ({ ...row, photoUrl: await sign(row.photo) })),
      ),
      bikes: await Promise.all(
        portal.bikes.map(async (row) => ({ ...row, photoUrl: await sign(row.photo) })),
      ),
    };
  });
export const getAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!role.data) throw new Error("Administrator access required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [users, profiles, roles] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      context.supabase.from("profiles").select("*"),
      context.supabase.from("user_roles").select("*"),
    ]);
    if (users.error || profiles.error || roles.error)
      throw new Error("Accounts could not be loaded");
    return users.data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      employee: profiles.data.find((p) => p.id === user.id)?.employee_id ?? null,
      role: roles.data.find((r) => r.user_id === user.id)?.role ?? "employee",
      self: user.id === context.userId,
    }));
  });
export const assignAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      account: z.string().uuid(),
      employee: z.string().uuid().nullable(),
      access_role: z.enum(["admin", "operations", "employee"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("assign_account", {
      account: data.account,
      employee: data.employee ?? "",
      access_role: data.access_role,
    });
    if (result.error)
      throw new Error(
        result.error.code === "23505"
          ? "This employee already has a linked account."
          : result.error.message,
      );
    return { ok: true };
  });
export const importBikes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ rows: z.array(z.record(z.string(), z.string())).min(1).max(500) }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("import_bikes", { rows: data.rows as Json });
    if (result.error)
      throw new Error(
        result.error.code === "23505"
          ? "A SKU already exists. No records were imported."
          : result.error.message,
      );
    return { count: result.data };
  });