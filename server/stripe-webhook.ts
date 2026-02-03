import type { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Webhook] Error processing event: ${error.message}`);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { getDb } = await import("./db");
  const { users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const userId = parseInt(session.client_reference_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in checkout session");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database connection failed");
    return;
  }

  // Update user with Stripe customer ID and subscription info
  await db
    .update(users)
    .set({
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
    })
    .where(eq(users.id, userId));

  console.log(`[Webhook] User ${userId} upgraded to Pro`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const { getDb } = await import("./db");
  const { users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return;

  const status = subscription.status;
  const tier = status === "active" || status === "trialing" ? "pro" : "free";
  const currentPeriodEnd = (subscription as any).current_period_end 
    ? new Date((subscription as any).current_period_end * 1000) 
    : null;

  // Get user before update to check if tier changed
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!user) {
    console.error(`[Webhook] No user found with subscription ${subscription.id}`);
    return;
  }

  const tierChanged = user.subscriptionTier !== tier;

  await db
    .update(users)
    .set({
      subscriptionStatus: status,
      subscriptionTier: tier,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
    })
    .where(eq(users.stripeSubscriptionId, subscription.id));

  console.log(`[Webhook] Subscription ${subscription.id} updated: ${status} (tier: ${tier})`);

  // Log tier changes
  if (tierChanged) {
    if (tier === "free") {
      console.log(`[Webhook] User ${user.id} downgraded to Free tier`);
    } else {
      console.log(`[Webhook] User ${user.id} upgraded to Pro tier`);
    }
  }

  // Handle specific status changes
  if (status === "canceled" || status === "unpaid") {
    console.log(`[Webhook] Subscription ${subscription.id} ${status} - user downgraded to Free`);
  } else if (status === "past_due") {
    console.log(`[Webhook] Subscription ${subscription.id} past due - payment retry in progress`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Invoice ${invoice.id} paid for customer ${invoice.customer}`);
  // Optionally: Send receipt email, update billing history, etc.
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Webhook] Payment failed for invoice ${invoice.id}`);
  // Optionally: Send notification to user, update subscription status
}
