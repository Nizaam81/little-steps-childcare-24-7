import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Stripe from "stripe";
import { z } from "zod";
import { ProviderRegistrationModel } from "../../../childcare/infrastructure/persistence/provider-registration.model.js";
import { ProviderSubscriptionModel } from "../../infrastructure/persistence/provider-subscription.model.js";
import { StripeWebhookEventModel } from "../../infrastructure/persistence/stripe-webhook-event.model.js";
import { isProviderSubscriptionEligible } from "../../application/provider-subscription-access.js";

class StripeBillingConfigurationError extends Error {}

const checkoutSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
});

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new StripeBillingConfigurationError("Stripe billing is not configured on the server.");
  }
  return new Stripe(secretKey);
}

async function getConfiguredPrice(stripe: Stripe): Promise<Stripe.Price> {
  const priceId = process.env.STRIPE_PRICE_ID;
  const productId = process.env.STRIPE_PRODUCT_ID;
  if (!priceId || !productId) {
    throw new StripeBillingConfigurationError("The Stripe product and recurring price are not configured.");
  }

  const price = await stripe.prices.retrieve(priceId);
  const actualProductId = typeof price.product === "string"
    ? price.product
    : price.product.id;
  if (!price.active || !price.recurring || actualProductId !== productId) {
    throw new StripeBillingConfigurationError("The configured Stripe price must be an active recurring price for the configured product.");
  }
  if (
    price.currency !== "inr" ||
    price.unit_amount !== 49900 ||
    price.recurring.interval !== "month" ||
    price.recurring.interval_count !== 1
  ) {
    throw new StripeBillingConfigurationError("The configured Stripe price must be exactly ₹499 INR per month.");
  }
  return price;
}

function providerDashboardUrl(query = ""): string {
  const configuredOrigin = process.env.FRONTEND_URL?.split(",")[0]?.trim() ||
    "http://localhost:5173";
  const origin = new URL(configuredOrigin).origin;
  return `${origin}/provider/dashboard?section=subscription${query}`;
}

function getProviderId(request: Request): string | null {
  const id = request.auth?.role === "provider" ? request.auth.sub : "";
  return isValidObjectId(id) ? id : null;
}

function getCustomerId(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

async function saveStripeSubscription(
  subscription: Stripe.Subscription,
  providerIdOverride?: string,
) {
  const existing = await ProviderSubscriptionModel.findOne({
    stripeSubscriptionId: subscription.id,
  }).select("providerId");
  let providerId = providerIdOverride ??
    subscription.metadata.providerId ??
    existing?.providerId.toString();
  if (!providerId) {
    const customerId = getCustomerId(subscription);
    const customer = await createStripeClient().customers.retrieve(customerId);
    if (!customer.deleted) {
      providerId = customer.metadata?.providerId;
    }
  }
  if (!providerId || !isValidObjectId(providerId)) return null;

  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : null;
  const periodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null;
  const paidThrough = periodEnd;
  const graceDays = Number.parseInt(process.env.STRIPE_PAST_DUE_GRACE_DAYS ?? "0", 10);
  const gracePeriodEnd = ["past_due", "unpaid"].includes(subscription.status) &&
    paidThrough
      ? new Date(paidThrough.getTime() + Math.max(0, graceDays) * 24 * 60 * 60 * 1000)
      : null;
  return ProviderSubscriptionModel.findOneAndUpdate(
    { providerId },
    {
      $set: {
        stripeCustomerId: getCustomerId(subscription),
        stripeSubscriptionId: subscription.id,
        priceId: firstItem?.price.id ?? "",
        status: subscription.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        gracePeriodEnd,
        paidThroughDate: paidThrough,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

async function findApprovedProvider(providerId: string) {
  return ProviderRegistrationModel.findOne({
    _id: providerId,
    status: "approved",
    isActive: { $ne: false },
  }).select("_id ownerName ownerEmail centreName");
}

export class ProviderSubscriptionController {
  getSubscription = async (request: Request, response: Response) => {
    const providerId = getProviderId(request);
    if (!providerId) return response.status(401).json({ message: "Provider authentication is required." });

    try {
      const stripe = createStripeClient();
      const price = await getConfiguredPrice(stripe);
      const subscription = await ProviderSubscriptionModel.findOne({ providerId });
      const hasAccess = isProviderSubscriptionEligible(subscription, new Date());
      return response.status(200).json({
        plan: {
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
          intervalCount: price.recurring?.interval_count ?? 1,
        },
        hasAccess,
        subscription: subscription
          ? {
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
              currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              hasAccess,
            }
          : null,
      });
    } catch (error: unknown) {
      if (error instanceof StripeBillingConfigurationError) {
        return response.status(503).json({ message: error.message });
      }
      console.error("Provider subscription retrieval failed:", error);
      return response.status(502).json({ message: "Unable to load subscription details right now." });
    }
  };

  createCheckoutSession = async (request: Request, response: Response) => {
    const providerId = getProviderId(request);
    if (!providerId) return response.status(401).json({ message: "Provider authentication is required." });

    try {
      const provider = await findApprovedProvider(providerId);
      if (!provider) return response.status(404).json({ message: "Your approved provider account was not found." });

      const currentSubscription = await ProviderSubscriptionModel.findOne({ providerId });
      if (isProviderSubscriptionEligible(currentSubscription, new Date())) {
        return response.status(409).json({
          message: "Your provider account already has a subscription. Use Manage billing to update it.",
        });
      }

      const stripe = createStripeClient();
      const price = await getConfiguredPrice(stripe);
      const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        line_items: [{ price: price.id, quantity: 1 }],
        client_reference_id: providerId,
        metadata: { providerId },
        subscription_data: { metadata: { providerId } },
        success_url: providerDashboardUrl("&checkout=success&session_id={CHECKOUT_SESSION_ID}"),
        cancel_url: providerDashboardUrl("&checkout=cancelled"),
      };
      if (currentSubscription?.stripeCustomerId) {
        checkoutOptions.customer = currentSubscription.stripeCustomerId;
      } else {
        checkoutOptions.customer_email = provider.ownerEmail;
      }
      const session = await stripe.checkout.sessions.create(checkoutOptions);
      if (!session.url) {
        return response.status(502).json({ message: "Stripe did not provide a checkout URL." });
      }
      return response.status(200).json({ url: session.url });
    } catch (error: unknown) {
      if (error instanceof StripeBillingConfigurationError) {
        return response.status(503).json({ message: error.message });
      }
      console.error("Provider subscription checkout creation failed:", error);
      return response.status(502).json({ message: "Unable to start subscription checkout right now." });
    }
  };

  createBillingPortalSession = async (request: Request, response: Response) => {
    const providerId = getProviderId(request);
    if (!providerId) return response.status(401).json({ message: "Provider authentication is required." });

    try {
      const subscription = await ProviderSubscriptionModel.findOne({ providerId });
      if (!subscription) {
        return response.status(404).json({ message: "No Stripe subscription was found for this provider account." });
      }

      const stripe = createStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: providerDashboardUrl(),
      });
      return response.status(200).json({ url: session.url });
    } catch (error: unknown) {
      if (error instanceof StripeBillingConfigurationError) {
        return response.status(503).json({ message: error.message });
      }
      console.error("Provider billing portal session creation failed:", error);
      return response.status(502).json({ message: "Unable to open the billing portal right now." });
    }
  };

  confirmCheckoutSession = async (request: Request, response: Response) => {
    const providerId = getProviderId(request);
    if (!providerId) return response.status(401).json({ message: "Provider authentication is required." });

    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: "Provide a valid Stripe checkout session ID." });
    }

    try {
      const stripe = createStripeClient();
      const session = await stripe.checkout.sessions.retrieve(parsed.data.sessionId);
      if (
        session.mode !== "subscription" ||
        session.status !== "complete" ||
        session.client_reference_id !== providerId
      ) {
        return response.status(404).json({ message: "A completed checkout session for this provider was not found." });
      }
      if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        return response.status(409).json({ message: "Subscription payment has not completed yet." });
      }

      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
      if (!subscriptionId) {
        return response.status(409).json({ message: "The completed checkout does not contain a subscription." });
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const record = await ProviderSubscriptionModel.findOne({ providerId })
        .select("status currentPeriodEnd paidThroughDate");
      const hasAccess = isProviderSubscriptionEligible(record, new Date());
      return response.status(200).json({
        status: hasAccess ? subscription.status : "pending",
        activatedByWebhook: hasAccess,
      });
    } catch (error: unknown) {
      if (error instanceof StripeBillingConfigurationError) {
        return response.status(503).json({ message: error.message });
      }
      console.error("Provider checkout confirmation failed:", error);
      return response.status(502).json({ message: "Unable to confirm this subscription checkout right now." });
    }
  };

  handleWebhook = async (request: Request, response: Response) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return response.status(503).json({ message: "Stripe webhook processing is not configured." });
    }
    const signature = request.get("stripe-signature");
    if (!signature || !Buffer.isBuffer(request.body)) {
      return response.status(400).json({ message: "A valid Stripe webhook signature and raw body are required." });
    }

    let event: Stripe.Event;
    let stripe: Stripe;
    try {
      stripe = createStripeClient();
    } catch (error: unknown) {
      if (error instanceof StripeBillingConfigurationError) {
        return response.status(503).json({ message: error.message });
      }
      console.error("Stripe webhook client initialization failed:", error);
      return response.status(500).json({ message: "Stripe webhook processing is unavailable." });
    }

    try {
      event = stripe.webhooks.constructEvent(request.body, signature, webhookSecret);
    } catch (error: unknown) {
      console.error("Stripe webhook signature verification failed:", error);
      return response.status(400).json({ message: "The Stripe webhook signature is invalid." });
    }

    try {
      let eventRecord = await StripeWebhookEventModel.findOne({ eventId: event.id });
      if (eventRecord?.status === "completed") {
        return response.status(200).json({ received: true });
      }
      if (!eventRecord) {
        try {
          eventRecord = await StripeWebhookEventModel.create({
            eventId: event.id,
            eventType: event.type,
            status: "processing",
          });
        } catch (error: unknown) {
          if (error instanceof Error && "code" in error && error.code === 11000) {
            const duplicate = await StripeWebhookEventModel.findOne({ eventId: event.id });
            if (duplicate?.status === "completed") {
              return response.status(200).json({ received: true });
            }
          } else {
            throw error;
          }
        }
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
          const providerId = session.client_reference_id ?? session.metadata?.providerId;
          if (subscriptionId && providerId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await saveStripeSubscription(subscription, providerId);
          }
        } else if (event.type === "checkout.session.expired") {
          const session = event.data.object as Stripe.Checkout.Session;
          const providerId = session.client_reference_id ?? session.metadata?.providerId;
          if (providerId && isValidObjectId(providerId)) {
            await ProviderSubscriptionModel.updateOne(
              { providerId, status: { $nin: ["active", "trialing"] } },
              { $set: { status: "incomplete_expired" } },
            );
          }
        } else if (
          event.type === "customer.subscription.created" ||
          event.type === "customer.subscription.updated" ||
          event.type === "customer.subscription.deleted"
        ) {
          const subscriptionEvent = event.data.object as Stripe.Subscription;
          if (event.type === "customer.subscription.deleted") {
            await saveStripeSubscription(subscriptionEvent);
          } else {
            const latestSubscription = await stripe.subscriptions.retrieve(subscriptionEvent.id);
            await saveStripeSubscription(latestSubscription);
          }
        } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
          const invoice = event.data.object as Stripe.Invoice;
          const invoiceData = invoice as unknown as {
            subscription?: string | { id: string };
          };
          const subscriptionId = typeof invoiceData.subscription === "string"
            ? invoiceData.subscription
            : invoiceData.subscription?.id;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await saveStripeSubscription(subscription);
          }
        }

        await StripeWebhookEventModel.updateOne(
          { eventId: event.id },
          { $set: { status: "completed", processedAt: new Date(), lastError: null } },
        );
        return response.status(200).json({ received: true });
      } catch (error: unknown) {
        await StripeWebhookEventModel.updateOne(
          { eventId: event.id },
          { $set: {
            status: "failed",
            lastError: error instanceof Error ? error.message : "Webhook processing failed",
          } },
        ).catch(() => undefined);
        throw error;
      }
    } catch (error: unknown) {
      console.error("Stripe webhook processing failed:", error);
      return response.status(500).json({ message: "Unable to process this Stripe webhook event." });
    }
  };
}
