// Skeleton for M4: refresh long-lived Instagram tokens before expiry.
// Will be invoked by a scheduled cron (pg_cron / Supabase scheduled function).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
    if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(SUPABASE_URL, SERVICE);

    // M4 will: select accounts where token_expires_at < now()+7d,
    // call https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...,
    // re-encrypt + update. For now return a no-op summary.
    const { count } = await admin
      .from("social_accounts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    return new Response(JSON.stringify({ ok: true, scheduled_for: "M4", active_accounts: count ?? 0 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meta-token-refresh error", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
