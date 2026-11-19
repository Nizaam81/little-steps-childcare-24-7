import { Schema, model } from "mongoose";

const providerSubscriptionSchema = new Schema(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ProviderRegistration",
      required: true,
      unique: true,
    },
    stripeCustomerId: { type: String, required: true, index: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    priceId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    gracePeriodEnd: { type: Date, default: null },
    paidThroughDate: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    expiryReminderSentFor: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ProviderSubscriptionModel = model(
  "ProviderSubscription",
  providerSubscriptionSchema,
);
