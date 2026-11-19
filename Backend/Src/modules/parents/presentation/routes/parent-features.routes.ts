import { Router } from "express";
import { ParentFeaturesController } from "../controllers/parent-features.controller.js";

export const parentFeaturesRoutes = Router();
const controller = new ParentFeaturesController();

parentFeaturesRoutes.get("/profile", controller.getProfile);
parentFeaturesRoutes.patch("/profile", controller.updateProfile);
parentFeaturesRoutes.get("/centres", controller.listCentres);
parentFeaturesRoutes.get("/caregivers/recommended", controller.recommendedCaregivers);
parentFeaturesRoutes.get("/wishlist", controller.listWishlist);
parentFeaturesRoutes.post("/wishlist", controller.addWishlist);
parentFeaturesRoutes.delete("/wishlist/:targetType/:targetId", controller.removeWishlist);
parentFeaturesRoutes.post("/feedback", controller.addFeedback);
parentFeaturesRoutes.get("/notifications", controller.listNotifications);
parentFeaturesRoutes.patch("/notifications/:notificationId/read", controller.markNotificationsRead);
parentFeaturesRoutes.post("/bookings", controller.createBooking);
parentFeaturesRoutes.post("/bookings/:bookingId/camera-access", controller.requestCameraAccess);
parentFeaturesRoutes.delete("/bookings/:bookingId", controller.cancelBooking);
parentFeaturesRoutes.get("/bookings", controller.listBookings);