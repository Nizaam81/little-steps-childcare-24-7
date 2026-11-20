import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, CreditCard, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/api-error-message";
import {
  confirmProviderCheckout,
  createProviderBillingPortalSession,
  createProviderCheckoutSession,
  fetchProviderSubscription,
  type ProviderSubscriptionDetails,
} from "./providerSubscriptionApi";

const includedFeatures = [
  "Manage daycare centre profile",
  "Manage daycare facilities and services",
  "View and manage parent booking requests",
  "Manage daycare information",
  "Manage caregiver profiles and availability",
  "Approve camera-access requests",
];

function formatPrice(plan: ProviderSubscriptionDetails["plan"]): string {
  if (plan.amount === null) return "Price unavailable";
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: plan.currency,
  });
  const minorUnitDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const amount = formatter.format(plan.amount / (10 ** minorUnitDigits));
  const interval = plan.interval ?? "billing period";
  const frequency = plan.intervalCount === 1
    ? interval
    : `${plan.intervalCount} ${interval}s`;
  return `${amount} / ${frequency}`;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function ProviderSubscription({
  onSubscriptionChange,
}: {
  onSubscriptionChange?: (hasAccess: boolean, activationPending: boolean) => void;
}) {
  const [billing, setBilling] = useState<ProviderSubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [action, setAction] = useState<"checkout" | "portal" | null>(null);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const [activationPending, setActivationPending] = useState(false);
  const activationPendingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const checkoutResult = url.searchParams.get("checkout");
    const sessionId = url.searchParams.get("session_id");

    const clearCheckoutResult = () => {
      url.searchParams.delete("checkout");
      url.searchParams.delete("session_id");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    };

    const loadBilling = async () => {
      setLoading(true);
      setLoadError("");
      try {
        if (checkoutResult === "success") {
          if (!sessionId) {
            throw new Error("Stripe returned a successful checkout without a session ID.");
          }
          await confirmProviderCheckout(sessionId);
          activationPendingRef.current = true;
          clearCheckoutResult();
          if (active) toast("Checkout received. Verifying your subscription activation.");
        } else if (checkoutResult === "cancelled" && active) {
          clearCheckoutResult();
          toast("Checkout was cancelled. No subscription was created.");
        }

        let details = await fetchProviderSubscription();
        if (checkoutResult === "success" || activationPendingRef.current) {
          for (let attempt = 0; attempt < 6 && !details.hasAccess; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 2_000));
            if (!active) return;
            details = await fetchProviderSubscription();
          }
        }
        if (active) {
          const waitingForWebhook = !details.hasAccess &&
            (checkoutResult === "success" || activationPendingRef.current);
          activationPendingRef.current = waitingForWebhook;
          setActivationPending(waitingForWebhook);
          setBilling(details);
          setLoadError("");
          onSubscriptionChange?.(details.hasAccess, waitingForWebhook);
          if (waitingForWebhook) {
            toast("Payment received. Access will unlock after Stripe verifies the subscription.");
          }
        }
      } catch (error: unknown) {
        if (active) {
          const message = checkoutResult === "success" &&
            axios.isAxiosError(error) &&
            error.response?.status === 409
            ? `Payment was not completed or verified. Paid features remain locked. ${getApiErrorMessage(error, "")}`
            : getApiErrorMessage(error, "Unable to load subscription details.");
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadBilling();
    return () => {
      active = false;
    };
  }, [onSubscriptionChange, refreshAttempt]);

  const isSubscribed = Boolean(billing?.hasAccess);

  const startCheckout = async () => {
    setAction("checkout");
    try {
      window.location.assign(await createProviderCheckoutSession());
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to start subscription checkout."));
      setAction(null);
    }
  };

  const openBillingPortal = async () => {
    setAction("portal");
    try {
      window.location.assign(await createProviderBillingPortalSession());
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to open the Stripe billing portal."));
      setAction(null);
    }
  };

  const subscription = billing?.subscription;
  const statusLabel = subscription?.status ?? "Not subscribed";
  const statusStyle = subscription?.status === "active" || subscription?.status === "trialing"
    ? "bg-emerald-100 text-emerald-800"
    : subscription
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-200 text-slate-700";

  return (
    <section className="space-y-5" aria-labelledby="provider-subscription-title">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#278a70]">
          Provider billing
        </p>
        <h2
          id="provider-subscription-title"
          className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl"
        >
          Subscription
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          One plan with access to all currently available provider features.
        </p>
      </header>
      {!loading && !isSubscribed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h3 className="text-base font-extrabold">
            {activationPending ? "Verifying subscription activation" : "Subscription required"}
          </h3>
          <p className="mt-2 text-sm leading-6">
            {activationPending
              ? "Stripe has received your payment. Paid features stay locked until the backend confirms your subscription."
              : "The dashboard, centre information, booking history and subscription page remain available for free. Subscribe to ₹499/month to edit centre details, manage operations and respond to family requests."}
          </p>
          {activationPending && (
            <button
              type="button"
              onClick={() => setRefreshAttempt((current) => current + 1)}
              className="mt-3 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold"
            >
              Refresh activation status
            </button>
          )}
        </div>
      )}

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setRefreshAttempt((current) => current + 1)}
            className="mt-2 rounded-lg border border-rose-300 px-3 py-1.5 font-semibold"
          >
            Retry subscription status
          </button>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <article className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500">Provider plan</p>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
                Little Steps Provider Plan
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Everything currently available in your provider dashboard.
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-[#f2f8f5] px-4 py-3 sm:text-right">
              <p className="text-xl font-extrabold tracking-tight text-[#237960]">
                {loading ? "Loading plan…" : billing ? formatPrice(billing.plan) : "—"}
              </p>
              <p className="text-sm font-medium text-slate-500">Recurring Stripe price</p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="text-sm font-bold">Included features</h4>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check
                    size={17}
                    className="mt-0.5 shrink-0 text-[#278a70]"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="rounded-2xl border border-[#e5ece8] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6f0] text-[#278a70]">
              <CreditCard size={19} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-extrabold">Manage subscription</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                View billing dates or manage payment details
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">Current status</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>
              {loading ? "Loading…" : statusLabel}
            </span>
          </div>

          <dl className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <CalendarDays
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Current period starts
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">
                  {formatDate(subscription?.currentPeriodStart ?? null)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Current period ends
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">
                  {formatDate(subscription?.currentPeriodEnd ?? null)}
                  {subscription?.cancelAtPeriodEnd && " · Cancels at period end"}
                </dd>
              </div>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => void (isSubscribed ? openBillingPortal() : startCheckout())}
            disabled={loading || Boolean(loadError) || action !== null || activationPending}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#278a70] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1f755f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#278a70] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubscribed
              ? <><ExternalLink size={16} aria-hidden="true" /> {action === "portal" ? "Opening billing…" : "Manage billing"}</>
              : activationPending
                ? "Waiting for Stripe verification…"
                : action === "checkout"
                  ? "Opening secure checkout…"
                  : "Subscribe Now"}
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Payments are securely handled by Stripe. You can manage or cancel an active plan in the billing portal.
          </p>
        </article>
      </div>
    </section>
  );
}
