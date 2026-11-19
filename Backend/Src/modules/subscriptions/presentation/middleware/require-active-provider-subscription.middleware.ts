import { isValidObjectId } from "mongoose";
import type { RequestHandler } from "express";
import { ProviderSubscriptionModel } from "../../infrastructure/persistence/provider-subscription.model.js";
import { isProviderSubscriptionEligible } from "../../application/provider-subscription-access.js";
import { ProviderRegistrationModel } from "../../../childcare/infrastructure/persistence/provider-registration.model.js";

export const requireActiveProviderSubscription: RequestHandler =
  async (request, response, next) => {
    const providerId = request.auth?.role === "provider" ? request.auth.sub : "";
    if (!isValidObjectId(providerId)) {
      return response.status(401).json({ message: "Provider authentication is required." });
    }

    try {
      const provider = await ProviderRegistrationModel.findOne({
        _id: providerId,
        status: "approved",
        isActive: { $ne: false },
      }).select("_id");
      if (!provider) {
        return response.status(403).json({
          code: "CENTRE_APPROVAL_REQUIRED",
          message: "Your approved daycare centre is required before using provider workspace features.",
        });
      }

      const subscription = await ProviderSubscriptionModel.findOne({ providerId })
        .select("providerId status currentPeriodStart currentPeriodEnd trialEnd gracePeriodEnd paidThroughDate cancelAtPeriodEnd");

      if (!isProviderSubscriptionEligible(subscription, new Date())) {
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
