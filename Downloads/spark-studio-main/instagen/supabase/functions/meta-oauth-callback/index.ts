import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Proper HTML entity encoding — covers &, <, >, ", ' so the message can be
// safely interpolated into the card body.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escape content going into an inline <script> as a JSON literal. JSON.stringify
// alone does NOT protect against `</script>` in the string — the HTML parser
// stops at `</` regardless of JSON context. Encode `<` and `>` as unicode
// escapes.
function escapeScriptJson(s: string): string {
  return JSON.stringify(s)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function htmlResponse(kind: "success" | "error", message: string) {
  // Lock postMessage to the SPA origin. Fall back to a safe default that still
  // rejects wildcard delivery.
  const appOrigin = Deno.env.get("APP_ORIGIN") ?? "";
  const originLiteral = appOrigin ? JSON.stringify(appOrigin) : "location.origin";

  const safeBody = escapeHtml(message);
  const safeKind = kind === "success" ? "success" : "error";
  const scriptMessage = escapeScriptJson(message);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Meta OAuth</title>
<style>body{font-family:system-ui,sans-serif;background:#0b0b14;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}
.card{max-width:420px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:32px;backdrop-filter:blur(20px)}
h1{margin:0 0 8px;font-size:20px}p{opacity:.8;margin:0}</style></head>
<body><div class="card"><h1>${safeKind === "success" ? "✅ Conectado!" : "❌ Erro"}</h1><p>${safeBody}</p>
<p style="margin-top:16px;font-size:13px;opacity:.6">Esta janela fechará automaticamente…</p></div>
<script>
try { window.opener && window.opener.postMessage({ type: 'meta-oauth-${safeKind}', message: ${scriptMessage} }, ${originLiteral}); } catch(e){}
setTimeout(() => { try { window.close(); } catch(e){} }, 1500);
</script></body></html>`;
  return new Response(html, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const errParam = url.searchParams.get("error");
    const errDesc = url.searchParams.get("error_description");

    if (errParam) {
      console.error("oauth provider error", errParam, errDesc);
      return htmlResponse("error", errDesc || errParam);
    }
    if (!code || !state) return htmlResponse("error", "missing code or state");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const META_APP_ID = Deno.env.get("META_APP_ID") ?? "";
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
    const META_REDIRECT_URI = Deno.env.get("META_REDIRECT_URI") ?? "";
    const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v21.0";

    console.log("[oauth-callback] redirect_uri:", JSON.stringify(META_REDIRECT_URI));
    if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
      return htmlResponse("error", "Meta app not configured");
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Validate + consume state
    const { data: stRow, error: stErr } = await admin
      .from("oauth_states")
      .select("id,user_id,brand_id,provider,expires_at,consumed_at")
      .eq("state", state)
      .maybeSingle();
    if (stErr || !stRow) return htmlResponse("error", "invalid state");
    if (stRow.consumed_at) return htmlResponse("error", "state already used");
    if (new Date(stRow.expires_at).getTime() < Date.now()) return htmlResponse("error", "state expired");

    await admin.from("oauth_states").update({ consumed_at: new Date().toISOString() }).eq("id", stRow.id);

    // 1) Exchange code -> short-lived token
    const form = new URLSearchParams();
    form.set("client_id", META_APP_ID);
    form.set("client_secret", META_APP_SECRET);
    form.set("grant_type", "authorization_code");
    form.set("redirect_uri", META_REDIRECT_URI);
    form.set("code", code);

    let shortToken = "";
    let igUserIdFromExchange = "";
    try {
      const r = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const respText = await r.text();
      let j: Record<string, unknown> = {};
      try {
        j = JSON.parse(respText);
      } catch {
        j = { raw: respText };
      }
      if (!r.ok) {
        // Strip access_token before logging — it's present on success and some error shapes.
        const safeErr: Record<string, unknown> = { ...j };
        delete (safeErr as Record<string, unknown>).access_token;
        console.error("short-lived exchange failed", r.status, safeErr);
        const errorMessage = typeof j.error_message === "string"
          ? j.error_message
          : typeof (j.error as { message?: unknown } | undefined)?.message === "string"
            ? (j.error as { message: string }).message
            : "token exchange failed";
        return htmlResponse("error", errorMessage);
      }
      shortToken = typeof j.access_token === "string" ? j.access_token : "";
      igUserIdFromExchange = String(j.user_id ?? "");
    } catch (e) {
      console.error("short-lived exchange error", e);
      return htmlResponse("error", "token exchange failed");
    }

    // 2) Exchange short -> long-lived (60 days)
    let longToken = shortToken;
    let expiresIn = 60 * 24 * 3600;
    try {
      const u = new URL("https://graph.instagram.com/access_token");
      u.searchParams.set("grant_type", "ig_exchange_token");
      u.searchParams.set("client_secret", META_APP_SECRET);
      u.searchParams.set("access_token", shortToken);
      const r = await fetch(u.toString());
      const j = await r.json();
      if (r.ok && j.access_token) {
        longToken = j.access_token;
        if (typeof j.expires_in === "number") expiresIn = j.expires_in;
      } else {
        const safeErr: Record<string, unknown> = { ...j };
        delete safeErr.access_token;
        console.error("long-lived exchange failed", safeErr);
      }
    } catch (e) {
      console.error("long-lived exchange error", e);
    }

    // 3) Fetch profile
    let username = "", name = "", picture = "", externalId = igUserIdFromExchange, accountType = "";
    try {
      const u = new URL(`https://graph.instagram.com/${GRAPH_VERSION}/me`);
      u.searchParams.set("fields", "user_id,username,name,account_type,profile_picture_url");
      u.searchParams.set("access_token", longToken);
      const r = await fetch(u.toString());
      const j = await r.json();
      if (r.ok) {
        username = j.username ?? "";
        name = j.name ?? "";
        picture = j.profile_picture_url ?? "";
        accountType = j.account_type ?? "";
        externalId = String(j.user_id ?? externalId);
      } else {
        console.error("profile fetch failed", j);
      }
    } catch (e) {
      console.error("profile fetch error", e);
    }

    if (!externalId) return htmlResponse("error", "could not resolve account id");

    // 4) Encrypt token via SQL helper
    const { data: encData, error: encErr } = await admin.rpc("encrypt_token", { plain: longToken });
    if (encErr) {
      console.error("encrypt_token error", encErr);
      return htmlResponse("error", "encryption failed");
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const nowIso = new Date().toISOString();

    // 5) Upsert social_accounts
    const { error: upErr } = await admin
      .from("social_accounts")
      .upsert({
        user_id: stRow.user_id,
        brand_id: stRow.brand_id,
        provider: stRow.provider,
        external_id: externalId,
        username,
        display_name: name,
        avatar_url: picture,
        ig_user_id: externalId,
        access_token_encrypted: encData,
        token_expires_at: tokenExpiresAt,
        scopes: [
          "instagram_business_basic",
          "instagram_business_content_publish",
          "instagram_business_manage_comments",
          "instagram_business_manage_insights",
        ],
        status: "active",
        last_error: null,
        connected_at: nowIso,
        last_refreshed_at: nowIso,
        meta: { account_type: accountType },
      }, { onConflict: "user_id,provider,external_id" });

    if (upErr) {
      console.error("social_accounts upsert error", upErr);
      return htmlResponse("error", "failed to save account");
    }

    return htmlResponse("success", `@${username || externalId} conectado com sucesso`);
  } catch (err) {
    console.error("meta-oauth-callback fatal", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return htmlResponse("error", msg);
  }
});
