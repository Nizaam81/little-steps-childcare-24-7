import { isValidObjectId } from "mongoose";

export type ProviderSubscriptionAccessRecord = {
  providerId: unknown;
  status: string;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  trialEnd?: Date | null;
  gracePeriodEnd?: Date | null;
  paidThroughDate?: Date | null;
  cancelAtPeriodEnd?: boolean;
};

export function isProviderSubscriptionEligible(
  subscription: ProviderSubscriptionAccessRecord | null,
  now = new Date(),
): boolean {
  if (!subscription) return false;
  if (!isValidObjectId(subscription.providerId?.toString())) return false;

  if (subscription.status === "active") {
    const paidThrough = subscription.paidThroughDate ??
      subscription.currentPeriodEnd;
    return Boolean(paidThrough && paidThrough.getTime() > now.getTime());
  }

  if (subscription.status === "trialing") {
    const trialEnd = subscription.trialEnd ??
      subscription.currentPeriodEnd;
    return Boolean(trialEnd && trialEnd.getTime() > now.getTime());
  }

  if (subscription.status === "past_due") {
    const graceEnd = subscription.gracePeriodEnd;
    return Boolean(graceEnd && graceEnd.getTime() > now.getTime());
  }

  if (subscription.status === "canceled") {
    const paidThrough = subscription.paidThroughDate ??
      subscription.currentPeriodEnd;
    return Boolean(paidThrough && paidThrough.getTime() > now.getTime());
  }

  return false;
}
