// Webhook Stripe: processa checkout.session.completed e customer.subscription.updated/deleted.
// Configure STRIPE_WEBHOOK_SECRET no Supabase (signing secret do endpoint no Stripe Dashboard).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const PLAN_LIMITS: Record<string, { max_accounts: number; max_daily_actions: number }> = {
  pro: { max_accounts: 3, max_daily_actions: 500 },
  business: { max_accounts: 10, max_daily_actions: 2000 },
};

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig || !webhookSecret) {
    console.error("Missing signature or STRIPE_WEBHOOK_SECRET");
    return new Response("Bad request", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error("Webhook signature verification failed:", e);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId = session.subscription as string;
      const userId = session.metadata?.supabase_user_id || (session as any).client_reference_id;
      const planId = session.metadata?.plan_id || "pro";
      if (!userId || !subId) {
        console.error("Missing user_id or subscription id");
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.pro;
      const sub = await stripe.subscriptions.retrieve(subId);
      const periodEnd = sub.current_period_end;
      const periodStart = sub.current_period_start;
      const { data: existing } = await supabase.from("subscriptions").select("id").eq("user_id", userId).maybeSingle();
      if (existing) {
        await supabase.from("subscriptions").update({
          plan: planId,
          status: sub.status,
          stripe_subscription_id: subId,
          max_accounts: limits.max_accounts,
          max_daily_actions: limits.max_daily_actions,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
        }).eq("user_id", userId);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subId,
          plan: planId,
          status: sub.status,
          max_accounts: limits.max_accounts,
          max_daily_actions: limits.max_daily_actions,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
        });
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const planId = (sub.metadata?.plan_id as string) || "pro";
      const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.pro;
      const { data: row } = await supabase.from("subscriptions").select("id, user_id").eq("stripe_subscription_id", sub.id).maybeSingle();
      if (row) {
        const payload: Record<string, unknown> = {
          status: sub.status,
          max_accounts: limits.max_accounts,
          max_daily_actions: limits.max_daily_actions,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        };
        if (event.type === "customer.subscription.deleted") {
          payload.plan = "free";
          payload.stripe_subscription_id = null;
          payload.max_accounts = 1;
          payload.max_daily_actions = 50;
        }
        await supabase.from("subscriptions").update(payload).eq("id", row.id);
      }
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
