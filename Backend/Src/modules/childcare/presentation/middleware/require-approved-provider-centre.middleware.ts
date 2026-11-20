import { isValidObjectId } from "mongoose";
import type { RequestHandler } from "express";
import { ProviderRegistrationModel } from "../../infrastructure/persistence/provider-registration.model.js";

export const requireApprovedProviderCentre: RequestHandler =
  async (request, response, next) => {
    const providerId = request.auth?.role === "provider" ? request.auth.sub : "";
    if (!isValidObjectId(providerId)) {
      return response.status(401).json({ message: "Provider authentication is required." });
    }

    try {
      const provider = await ProviderRegistrationModel.findById(providerId)
        .select("status isActive");
      if (!provider) {
        return response.status(404).json({ message: "Your daycare centre was not found." });
      }
      if (provider.isActive === false) {
        return response.status(403).json({
          code: "CENTRE_INACTIVE",
          message: "Your daycare centre is inactive. Contact support for assistance.",
        });
      }
      if (provider.status !== "approved") {
        return response.status(403).json({
          code: "CENTRE_APPROVAL_REQUIRED",
          message: provider.status === "rejected"
            ? "Your daycare centre was not approved. Review the admin feedback before using operational features."
            : "Your daycare centre is awaiting admin approval before operational features are available.",
        });
      }
      return next();
    } catch (error: unknown) {
      console.error("Provider centre approval check failed:", error);
      return response.status(500).json({ message: "Centre approval status is temporarily unavailable." });
    }
  };
