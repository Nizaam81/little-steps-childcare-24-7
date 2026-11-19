import { Router } from "express";
import { ProviderSubscriptionController } from "../controllers/provider-subscription.controller.js";

export const providerSubscriptionRoutes = Router();
export const providerSubscriptionController = new ProviderSubscriptionController();

providerSubscriptionRoutes.get("/", providerSubscriptionController.getSubscription);
providerSubscriptionRoutes.post("/checkout", providerSubscriptionController.createCheckoutSession);
providerSubscriptionRoutes.post("/portal", providerSubscriptionController.createBillingPortalSession);
providerSubscriptionRoutes.post("/confirm", providerSubscriptionController.confirmCheckoutSession);
