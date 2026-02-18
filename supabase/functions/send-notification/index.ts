// Edge Function: envia notificações por email (bot offline, rate limit, relatório diário).
// Configure RESEND_API_KEY no Supabase Dashboard > Project Settings > Edge Functions > Secrets.
// Domínio verificado no Resend para "onboarding@resend.dev" ou seu domínio.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("NOTIFICATION_FROM_EMAIL") || "OrganicPro <onboarding@resend.dev>";

type NotificationType = "bot_offline" | "rate_limit" | "daily_report";

const SUBJECTS: Record<NotificationType, string> = {
  bot_offline: "OrganicPro — Bot offline",
  rate_limit: "OrganicPro — Rate limit detectado",
  daily_report: "OrganicPro — Relatório diário",
};

function getBody(type: NotificationType, accountName?: string): string {
  const account = accountName ? ` (conta @${accountName})` : "";
  switch (type) {
    case "bot_offline":
      return `O bot${account} está offline há mais de 5 minutos. Verifique a extensão Bridge e a conexão.`;
    case "rate_limit":
      return `O Instagram pode ter aplicado rate limit${account}. Considere pausar ou reduzir a frequência de ações.`;
    case "daily_report":
      return `Resumo do dia${account}: acesse o dashboard para ver métricas e ações executadas.`;
    default:
      return "Notificação OrganicPro.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const { type, user_id, email: emailOverride, account_name } = body as {
      type?: NotificationType;
      user_id?: string;
      email?: string;
      account_name?: string;
    };

    if (!type || !["bot_offline", "rate_limit", "daily_report"].includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let email = emailOverride;
    if (!email && user_id) {
      const { data: prefs } = await supabase.from("user_settings").select("settings_json").eq("user_id", user_id).maybeSingle();
      const notif = (prefs?.settings_json as Record<string, unknown>)?.notifications as Record<string, boolean> | undefined;
      if (notif && type === "bot_offline" && !notif.bot_offline) return new Response(JSON.stringify({ skipped: "preference off" }), { status: 200, headers: { "Content-Type": "application/json" } });
      if (notif && type === "rate_limit" && !notif.rate_limit) return new Response(JSON.stringify({ skipped: "preference off" }), { status: 200, headers: { "Content-Type": "application/json" } });
      if (notif && type === "daily_report" && !notif.daily_report) return new Response(JSON.stringify({ skipped: "preference off" }), { status: 200, headers: { "Content-Type": "application/json" } });
      const { data: userData } = await supabase.auth.admin.getUserById(user_id);
      email = userData?.user?.email;
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "No email" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set; skipping send");
      return new Response(JSON.stringify({ ok: true, simulated: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: SUBJECTS[type],
        text: getBody(type, account_name),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: "Email send failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
