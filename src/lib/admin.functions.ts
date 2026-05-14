import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw new Error("Forbidden: admin role required");
    return next({ context });
  });

export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const [users, offers, apps, companies, msgs, reviews] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("job_offers").select("id, status, created_at"),
      supabaseAdmin.from("applications").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("companies").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }),
    ]);
    const offerRows = offers.data ?? [];
    const open = offerRows.filter((o: any) => o.status === "open").length;
    // last 7 days new offers
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: key.slice(5),
        count: offerRows.filter((o: any) => o.created_at?.slice(0, 10) === key).length,
      });
    }
    return {
      users: users.count ?? 0,
      offers: offerRows.length,
      openOffers: open,
      applications: apps.count ?? 0,
      companies: companies.count ?? 0,
      messages: msgs.count ?? 0,
      reviews: reviews.count ?? 0,
      offersByDay: days,
    };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data: profiles } = await supabaseAdmin
      .from("profiles").select("id, full_name, avatar_url, created_at").order("created_at", { ascending: false });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map(authList.users.map((u) => [u.id, u.email]));
    return (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      email: emailMap.get(p.id) ?? null,
      role: roles?.find((r: any) => r.user_id === p.id)?.role ?? "employee",
    }));
  });

export const adminUpdateUserRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { userId: string; role: "admin" | "recruiter" | "employee" }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "recruiter", "employee"]) }).parse(i))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListOffers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data: offers } = await supabaseAdmin
      .from("job_offers").select("*").order("created_at", { ascending: false });
    const ids = Array.from(new Set((offers ?? []).map((o: any) => o.recruiter_id)));
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as any[] };
    return (offers ?? []).map((o: any) => ({
      ...o,
      recruiter_name: profs?.find((p: any) => p.id === o.recruiter_id)?.full_name ?? "—",
    }));
  });

export const adminDeleteOffer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("applications").delete().eq("job_id", data.id);
    const { error } = await supabaseAdmin.from("job_offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleOfferStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string; status: "open" | "closed" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "closed"]) }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("job_offers").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCompanies = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data } = await supabaseAdmin.from("companies").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminDeleteCompany = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("companies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data } = await supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data } = await supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
