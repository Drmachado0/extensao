// Cria uma sessão Stripe Checkout para upgrade. Requer STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_BUSINESS.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
const PRICE_PRO = Deno.env.get("STRIPE_PRICE_PRO");
const PRICE_BUSINESS = Deno.env.get("STRIPE_PRICE_BUSINESS");

const PLAN_LIMITS: Record<string, { max_accounts: number; max_daily_actions: number }> = {
  pro: { max_accounts: 3, max_daily_actions: 500 },
  business: { max_accounts: 10, max_daily_actions: 2000 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user?.id) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const body = await req.json();
    const { plan_id, success_url, cancel_url } = body as { plan_id?: string; success_url?: string; cancel_url?: string };
    if (!plan_id || !["pro", "business"].includes(plan_id)) return new Response(JSON.stringify({ error: "Invalid plan_id" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const priceId = plan_id === "pro" ? PRICE_PRO : PRICE_BUSINESS;
    if (!priceId) return new Response(JSON.stringify({ error: "Price not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sub } = await supabaseAdmin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
      const { data: existing } = await supabaseAdmin.from("subscriptions").select("id").eq("user_id", user.id).maybeSingle();
      if (existing) {
        await supabaseAdmin.from("subscriptions").update({ stripe_customer_id: customerId }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("subscriptions").insert({ user_id: user.id, stripe_customer_id: customerId, plan: "free", status: "active", max_accounts: 1, max_daily_actions: 50 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get("origin") || ""}/settings?checkout=success`,
      cancel_url: cancel_url || `${req.headers.get("origin") || ""}/subscription`,
      subscription_data: { metadata: { supabase_user_id: user.id, plan_id } },
      metadata: { supabase_user_id: user.id, plan_id },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
