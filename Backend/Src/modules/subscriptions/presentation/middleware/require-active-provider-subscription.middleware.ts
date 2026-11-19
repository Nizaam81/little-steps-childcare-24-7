import { isValidObjectId } from "mongoose";
import type { RequestHandler } from "express";
import { ProviderSubscriptionModel } from "../../infrastructure/persistence/provider-subscription.model.js";

export const requireActiveProviderSubscription: RequestHandler =
  async (request, response, next) => {
    const providerId = request.auth?.role === "provider" ? request.auth.sub : "";
    if (!isValidObjectId(providerId)) {
      return response.status(401).json({ message: "Provider authentication is required." });
    }

    try {
      const subscription = await ProviderSubscriptionModel.findOne({
        providerId,
        status: { $in: ["active", "trialing"] },
        currentPeriodEnd: { $gt: new Date() },
      }).select("_id");

      if (!subscription) {
        return response.status(402).json({
          code: "SUBSCRIPTION_REQUIRED",
          message: "An active provider subscription is required to use this feature.",
        });
      }

      return next();
    } catch (error: unknown) {
      console.error("Provider subscription access check failed:", error);
      return response.status(500).json({ message: "Subscription access is temporarily unavailable." });
    }
  };
