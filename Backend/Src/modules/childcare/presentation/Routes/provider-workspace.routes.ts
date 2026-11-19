import { Router } from "express";
import multer from "multer";
import { requireActiveProviderSubscription } from "../../../subscriptions/presentation/middleware/require-active-provider-subscription.middleware.js";
import { ProviderWorkspaceController } from "../controllers/provider-workspace.controller.js";
import { daycarePhotoUpload } from "../middleware/upload-daycare-photo.js";

export const providerWorkspaceRoutes = Router();
const controller = new ProviderWorkspaceController();

providerWorkspaceRoutes.get("/", controller.getWorkspace);
providerWorkspaceRoutes.patch(
  "/profile",
  requireActiveProviderSubscription,
  controller.updateProfile,
);
providerWorkspaceRoutes.post(
  "/photos",
  requireActiveProviderSubscription,
  (request, response, next) => {
    daycarePhotoUpload.single("photo")(request, response, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        return response.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
          message: error.code === "LIMIT_FILE_SIZE"
            ? "Each daycare photo must be 5 MB or smaller."
            : "Upload one photo at a time.",
        });
      }
      if (error instanceof Error && error.message === "INVALID_DAYCARE_PHOTO_TYPE") {
        return response.status(400).json({ message: "Daycare photos must be JPG, PNG or WebP images." });
      }
      if (error) {
        console.error("Daycare photo upload parsing failed:", error);
        return response.status(500).json({ message: "Unable to process this photo." });
      }
      return next();
    });
  },
  controller.addPhoto,
);
providerWorkspaceRoutes.delete(
  "/photos/:photoId",
  requireActiveProviderSubscription,
  controller.removePhoto,
);
providerWorkspaceRoutes.post(
  "/caregivers",
  requireActiveProviderSubscription,
  controller.addCaregiver,
);
providerWorkspaceRoutes.patch(
  "/caregivers/:caregiverId",
  requireActiveProviderSubscription,
  controller.updateCaregiver,
);
providerWorkspaceRoutes.delete(
  "/caregivers/:caregiverId",
  requireActiveProviderSubscription,
  controller.removeCaregiver,
);
providerWorkspaceRoutes.get("/bookings", controller.listBookings);
providerWorkspaceRoutes.patch(
  "/bookings/:bookingId",
  requireActiveProviderSubscription,
  controller.updateBooking,
);
providerWorkspaceRoutes.delete(
  "/bookings/:bookingId",
  requireActiveProviderSubscription,
  controller.deleteRejectedBooking,
);
providerWorkspaceRoutes.patch(
  "/bookings/:bookingId/camera-access",
  requireActiveProviderSubscription,
  controller.updateCameraAccess,
);