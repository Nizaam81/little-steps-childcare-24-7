import { Schema, model } from "mongoose";

const stripeWebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
      required: true,
    },
    lastError: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const StripeWebhookEventModel = model(
  "StripeWebhookEvent",
  stripeWebhookEventSchema,
);
