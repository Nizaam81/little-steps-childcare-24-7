import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { z } from "zod";
import { CaregiverProfileModel } from "../../../childcare/infrastructure/persistence/caregiver-profile.model.js";
import { BookingRequestModel } from "../../../childcare/infrastructure/persistence/booking-request.model.js";
import { ProviderRegistrationModel } from "../../../childcare/infrastructure/persistence/provider-registration.model.js";
import { ProviderWorkspaceModel } from "../../../childcare/infrastructure/persistence/provider-workspace.model.js";
import { ParentFeedbackModel } from "../../infrastructure/persistence/parent-feedback.model.js";
import { ParentNotificationModel } from "../../infrastructure/persistence/parent-notification.model.js";
import { ParentWishlistModel } from "../../infrastructure/persistence/parent-wishlist.model.js";
import { ParentRegistrationModel } from "../../infrastructure/persistence/parent.Modals.js";

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phoneNumber: z.string().trim().min(7).max(20).refine(
    (value) => /^[+]?[0-9\s()-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15,
    "Enter a valid phone number.",
  ),
});
const targetSchema = z.object({
  targetType: z.enum(["daycare", "caregiver"]),
  targetId: z.string().refine(isValidObjectId, "A valid target is required."),
});
const feedbackSchema = targetSchema.extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).default(""),
});
const bookingSchema = z.object({
  centreId: z.string().refine(isValidObjectId),
  childName: z.string().trim().min(2).max(100),
  carePlan: z.string().trim().min(2).max(100),
  requestedDate: z.string().datetime(),
  bookingStartDate: z.string().datetime(),
  bookingEndDate: z.string().datetime(),
  note: z.string().trim().max(1000).default(""),
}).superRefine((value, context) => {
  const start = new Date(value.bookingStartDate);
  const end = new Date(value.bookingEndDate);
  if (Number.isNaN(start.getTime()) || start < new Date()) {
    context.addIssue({ code: "custom", path: ["bookingStartDate"], message: "Booking start date cannot be in the past." });
  }
  if (Number.isNaN(end.getTime()) || end <= start) {
    context.addIssue({ code: "custom", path: ["bookingEndDate"], message: "Booking end date must be after the start date." });
  }
});

function parentId(request: Request): string {
  if (!request.auth) throw new Error("PARENT_AUTHENTICATION_REQUIRED");
  return request.auth.sub;
}

function safeRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export class ParentFeaturesController {
  getProfile = async (request: Request, response: Response) => {
    try {
      const parent = await ParentRegistrationModel.findOne({
        _id: parentId(request),
        emailVerified: true,
        isActive: { $ne: false },
      }).select("_id fullName email phoneNumber");
      if (!parent) return response.status(404).json({ message: "Parent profile was not found." });
      return response.status(200).json({
        profile: {
          id: parent.id,
          fullName: parent.fullName,
          email: parent.email,
          phoneNumber: parent.phoneNumber,
        },
      });
    } catch (error: unknown) {
      console.error("Parent profile retrieval failed:", error);
      return response.status(500).json({ message: "Unable to load your profile right now." });
    }
  };

  updateProfile = async (request: Request, response: Response) => {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: "Provide valid profile details.", errors: parsed.error.issues });
    }
    try {
      const parent = await ParentRegistrationModel.findOneAndUpdate(
        { _id: parentId(request), emailVerified: true, isActive: { $ne: false } },
        { $set: parsed.data },
        { returnDocument: "after", runValidators: true },
      ).select("_id fullName email phoneNumber");
      if (!parent) return response.status(404).json({ message: "Parent profile was not found." });
      return response.status(200).json({
        profile: {
          id: parent.id,
          fullName: parent.fullName,
          email: parent.email,
          phoneNumber: parent.phoneNumber,
        },
      });
    } catch (error: unknown) {
      console.error("Parent profile update failed:", error);
      return response.status(500).json({ message: "Unable to update your profile right now." });
    }
  };

  listCentres = async (request: Request, response: Response) => {
    try {
      const search = typeof request.query.search === "string" ? request.query.search.trim().slice(0, 100) : "";
      const centreFilter: Record<string, unknown> = {
        status: "approved",
        isActive: { $ne: false },
        isAcceptingBookings: { $ne: false },
      };
      if (search) {
        const expression = safeRegex(search);
        centreFilter.$or = [
          { centreName: expression },
          { address: expression },
          { district: expression },
        ];
      }

      const centres = await ProviderRegistrationModel.find(centreFilter)
        .select("_id centreName address district ageGroups careTypes capacity openingTime closingTime dailyPrice monthlyPrice")
        .sort({ reviewedAt: -1, updatedAt: -1 });
      const centreIds = centres.map((centre) => centre._id);
      const [workspaces, feedback] = await Promise.all([
        centreIds.length
          ? ProviderWorkspaceModel.find({ centreId: { $in: centreIds } }).select("centreId hourlyPrice description availabilitySlots availableDays photos")
          : [],
        centreIds.length
          ? ParentFeedbackModel.find({ targetType: "daycare", targetId: { $in: centreIds } }).select("targetId rating")
          : [],
      ]);
      const workspaceByCentre = new Map(workspaces.map((item) => [item.centreId.toString(), item]));
      const ratingsByCentre = new Map<string, number[]>();
      for (const item of feedback) {
        const id = item.targetId.toString();
        ratingsByCentre.set(id, [...(ratingsByCentre.get(id) ?? []), item.rating]);
      }

      return response.status(200).json({
        centres: centres.map((centre) => {
          const workspace = workspaceByCentre.get(centre.id);
          const ratings = ratingsByCentre.get(centre.id) ?? [];
          const average = ratings.length
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;
          return {
            id: centre.id,
            name: centre.centreName,
            address: centre.address,
            district: centre.district,
            ageGroups: centre.ageGroups,
            careTypes: centre.careTypes,
            capacity: centre.capacity,
            openingTime: centre.openingTime,
            closingTime: centre.closingTime,
            dailyPrice: Number(centre.dailyPrice) || 0,
            monthlyPrice: Number(centre.monthlyPrice) || 0,
            hourlyPrice: workspace?.hourlyPrice ?? 0,
            description: workspace?.description ?? "",
            availabilitySlots: workspace?.availabilitySlots ?? [],
            availableDays: workspace?.availableDays ?? [],
            photos: (workspace?.photos ?? []).map((photo) => ({
              id: photo._id.toString(),
              url: photo.url,
            })),
            rating: Number(average.toFixed(1)),
            reviews: ratings.length,
            verified: true,
          };
        }),
      });
    } catch (error: unknown) {
      console.error("Parent daycare discovery failed:", error);
      return response.status(500).json({ message: "Unable to load approved daycare centres right now." });
    }
  };

  recommendedCaregivers = async (_request: Request, response: Response) => {
    try {
      const caregivers = await CaregiverProfileModel.find({ isActive: true })
        .populate<{ centreId: { _id: Types.ObjectId; centreName: string; district: string } | null }>({
          path: "centreId",
          match: { status: "approved", isActive: { $ne: false } },
          select: "centreName district",
        })
        .sort({ createdAt: -1 })
        .limit(100);
      const visibleCaregivers = caregivers.flatMap((item) =>
        item.centreId ? [{ item, centre: item.centreId }] : [],
      );
      const caregiverIds = visibleCaregivers.map(({ item }) => item._id);
      const feedback = caregiverIds.length
        ? await ParentFeedbackModel.find({ targetType: "caregiver", targetId: { $in: caregiverIds } }).select("targetId rating")
        : [];
      const ratingsByCaregiver = new Map<string, number[]>();
      for (const item of feedback) {
        const id = item.targetId.toString();
        ratingsByCaregiver.set(id, [...(ratingsByCaregiver.get(id) ?? []), item.rating]);
      }
      const recommendations = visibleCaregivers.map(({ item, centre }) => {
        const ratings = ratingsByCaregiver.get(item.id) ?? [];
        return {
          id: item.id,
          name: item.name,
          role: item.role,
          experience: item.experience,
          centreId: centre._id.toString(),
          centreName: centre.centreName,
          district: centre.district,
          rating: ratings.length
            ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
            : 0,
          reviews: ratings.length,
        };
      });
      recommendations.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
      return response.status(200).json({ caregivers: recommendations.slice(0, 12) });
    } catch (error: unknown) {
      console.error("Caregiver recommendations failed:", error);
      return response.status(500).json({ message: "Unable to load caregiver recommendations right now." });
    }
  };

  listWishlist = async (request: Request, response: Response) => {
    try {
      const wishlist = await ParentWishlistModel.find({ parentId: parentId(request) }).sort({ createdAt: -1 });
      return response.status(200).json({
        wishlist: wishlist.map((item) => ({
          targetType: item.targetType,
          targetId: item.targetId.toString(),
        })),
      });
    } catch (error: unknown) {
      console.error("Parent wishlist retrieval failed:", error);
      return response.status(500).json({ message: "Unable to load your wishlist right now." });
    }
  };

  addWishlist = async (request: Request, response: Response) => {
    const parsed = targetSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: "Provide a valid daycare or caregiver.", errors: parsed.error.issues });
    try {
      let exists: boolean;
      if (parsed.data.targetType === "daycare") {
        exists = Boolean(await ProviderRegistrationModel.exists({
          _id: parsed.data.targetId,
          status: "approved",
          isActive: { $ne: false },
        }));
      } else {
        const caregiver = await CaregiverProfileModel.findOne({
          _id: parsed.data.targetId,
          isActive: true,
        }).select("centreId");
        exists = Boolean(caregiver && await ProviderRegistrationModel.exists({
          _id: caregiver.centreId,
          status: "approved",
          isActive: { $ne: false },
        }));
      }
      if (!exists) return response.status(404).json({ message: "The selected daycare or caregiver was not found." });

      await ParentWishlistModel.updateOne(
        { parentId: parentId(request), targetType: parsed.data.targetType, targetId: parsed.data.targetId },
        { $setOnInsert: { parentId: parentId(request), ...parsed.data } },
        { upsert: true },
      );
      return response.status(201).json({ saved: true });
    } catch (error: unknown) {
      console.error("Parent wishlist update failed:", error);
      return response.status(500).json({ message: "Unable to save this item right now." });
    }
  };

  removeWishlist = async (request: Request, response: Response) => {
    const parsed = targetSchema.safeParse({
      targetType: request.params.targetType,
      targetId: request.params.targetId,
    });
    if (!parsed.success) return response.status(400).json({ message: "The wishlist item is invalid." });
    try {
      await ParentWishlistModel.deleteOne({
        parentId: parentId(request),
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
      });
      return response.status(200).json({ saved: false });
    } catch (error: unknown) {
      console.error("Parent wishlist removal failed:", error);
      return response.status(500).json({ message: "Unable to remove this item right now." });
    }
  };

  addFeedback = async (request: Request, response: Response) => {
    const parsed = feedbackSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: "Provide a valid rating and feedback.", errors: parsed.error.issues });
    try {
      let target: boolean;
      if (parsed.data.targetType === "daycare") {
        target = Boolean(await ProviderRegistrationModel.exists({
          _id: parsed.data.targetId,
          status: "approved",
          isActive: { $ne: false },
        }));
      } else {
        const caregiver = await CaregiverProfileModel.findOne({
          _id: parsed.data.targetId,
          isActive: true,
        }).select("centreId");
        target = Boolean(caregiver && await ProviderRegistrationModel.exists({
          _id: caregiver.centreId,
          status: "approved",
          isActive: { $ne: false },
        }));
      }
      if (!target) return response.status(404).json({ message: "The reviewed daycare or caregiver was not found." });
      await ParentFeedbackModel.create({
        parentId: parentId(request),
        ...parsed.data,
      });
      return response.status(201).json({ message: "Thank you for sharing your feedback." });
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
        return response.status(409).json({ message: "You have already reviewed this daycare or caregiver." });
      }
      console.error("Parent feedback submission failed:", error);
      return response.status(500).json({ message: "Unable to save your feedback right now." });
    }
  };

  listNotifications = async (request: Request, response: Response) => {
    try {
      const notifications = await ParentNotificationModel.find({ parentId: parentId(request) })
        .sort({ createdAt: -1 })
        .limit(50)
        .select("_id title message type relatedId readAt createdAt");
      return response.status(200).json({
        notifications: notifications.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type,
          relatedId: item.relatedId,
          read: Boolean(item.readAt),
          createdAt: item.createdAt,
        })),
      });
    } catch (error: unknown) {
      console.error("Parent notifications retrieval failed:", error);
      return response.status(500).json({ message: "Unable to load notifications right now." });
    }
  };

  markNotificationsRead = async (request: Request, response: Response) => {
    try {
      if (request.params.notificationId === "all") {
        await ParentNotificationModel.updateMany(
          { parentId: parentId(request), readAt: null },
          { $set: { readAt: new Date() } },
        );
      } else {
        if (!isValidObjectId(request.params.notificationId)) {
          return response.status(400).json({ message: "The notification ID is invalid." });
        }
        await ParentNotificationModel.updateOne(
          { _id: request.params.notificationId, parentId: parentId(request) },
          { $set: { readAt: new Date() } },
        );
      }
      return response.status(200).json({ markedRead: true });
    } catch (error: unknown) {
      console.error("Parent notification update failed:", error);
      return response.status(500).json({ message: "Unable to update notifications right now." });
    }
  };

  createBooking = async (request: Request, response: Response) => {
    const parsed = bookingSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: "Provide valid booking details.", errors: parsed.error.issues });
    try {
      const [parent, centre] = await Promise.all([
        ParentRegistrationModel.findOne({
          _id: parentId(request),
          isActive: { $ne: false },
          emailVerified: true,
        }).select("fullName"),
        ProviderRegistrationModel.findOne({
          _id: parsed.data.centreId,
          status: "approved",
          isActive: { $ne: false },
          isAcceptingBookings: { $ne: false },
        }).select("_id centreName"),
      ]);
      if (!parent) return response.status(404).json({ message: "Parent profile was not found." });
      if (!centre) return response.status(404).json({ message: "This daycare is not currently accepting requests." });

      const start = new Date(parsed.data.bookingStartDate);
      const end = new Date(parsed.data.bookingEndDate);
      if (end <= start) {
        return response.status(400).json({ message: "The booking end date must be after its start date." });
      }
      const now = new Date();
      const acceptedBooking = await BookingRequestModel.exists({
        parentId: parent._id,
        status: "accepted",
        $or: [
          { bookingStartDate: { $lte: now }, bookingEndDate: { $gte: now } },
          { bookingStartDate: { $lte: end }, bookingEndDate: { $gte: start } },
        ],
      });
      if (acceptedBooking) {
        return response.status(409).json({
          message: "You already have an accepted booking during this period. New requests are unavailable until it ends.",
        });
      }

      const booking = await BookingRequestModel.create({
        ...parsed.data,
        parentId: parent._id,
        requestedDate: new Date(parsed.data.requestedDate),
        bookingStartDate: start,
        bookingEndDate: end,
      });
      await ParentNotificationModel.create({
        parentId: parent._id,
        title: "Request sent",
        message: `Your care request was sent to ${centre.centreName}.`,
        type: "booking",
        relatedId: booking.id,
      });
      return response.status(201).json({
        booking: {
          id: booking.id,
          centreId: centre.id,
          centreName: centre.centreName,
          childName: booking.childName,
          carePlan: booking.carePlan,
          requestedDate: booking.requestedDate,
          status: booking.status,
        },
      });
    } catch (error: unknown) {
      console.error("Parent daycare request failed:", error);
      return response.status(500).json({ message: "Unable to send your daycare request right now." });
    }
  };

  listBookings = async (request: Request, response: Response) => {
    try {
      const bookings = await BookingRequestModel.find({ parentId: parentId(request) })
        .populate<{ centreId: { _id: Types.ObjectId; centreName: string; address: string; district: string } | null }>({
          path: "centreId",
          select: "centreName address district",
        })
        .sort({ createdAt: -1 });
      return response.status(200).json({
        bookings: bookings.flatMap((item) => {
          const centre = item.centreId;
          if (!centre) return [];
          return {
            id: item.id,
            centreId: centre._id.toString(),
            centreName: centre.centreName,
            location: `${centre.address}, ${centre.district}`,
            childName: item.childName,
            carePlan: item.carePlan,
            requestedDate: item.requestedDate,
            bookingStartDate: item.bookingStartDate,
            bookingEndDate: item.bookingEndDate,
            cameraAccessStatus: item.cameraAccessStatus,
            status: item.status,
          };
        }),
      });
    } catch (error: unknown) {
      console.error("Parent booking retrieval failed:", error);
      return response.status(500).json({ message: "Unable to load your daycare requests right now." });
    }
  };

  cancelBooking = async (request: Request, response: Response) => {
    if (!isValidObjectId(request.params.bookingId)) {
      return response.status(400).json({ message: "The booking ID is invalid." });
    }
    try {
      const booking = await BookingRequestModel.findOneAndUpdate(
        {
          _id: request.params.bookingId,
          parentId: parentId(request),
          status: { $in: ["pending", "rejected"] },
        },
        { $set: { status: "canceled" } },
        { returnDocument: "after" },
      );
      if (!booking) {
        return response.status(409).json({
          message: "Only pending or rejected booking requests can be canceled.",
        });
      }
      return response.status(200).json({ canceled: true, bookingId: booking.id });
    } catch (error: unknown) {
      console.error("Parent booking cancellation failed:", error);
      return response.status(500).json({ message: "Unable to cancel this booking request right now." });
    }
  };

  requestCameraAccess = async (request: Request, response: Response) => {
    if (!isValidObjectId(request.params.bookingId)) {
      return response.status(400).json({ message: "The booking ID is invalid." });
    }
    try {
      const now = new Date();
      const booking = await BookingRequestModel.findOneAndUpdate(
        {
          _id: request.params.bookingId,
          parentId: parentId(request),
          status: "accepted",
          bookingStartDate: { $lte: now },
          bookingEndDate: { $gte: now },
          cameraAccessStatus: { $in: ["not_requested", "rejected"] },
        },
        { $set: { cameraAccessStatus: "pending", cameraAccessRequestedAt: now } },
        { returnDocument: "after" },
      );
      if (!booking) {
        return response.status(409).json({
          message: "Camera access can only be requested while an accepted booking is active.",
        });
      }
      return response.status(201).json({ requested: true, status: booking.cameraAccessStatus });
    } catch (error: unknown) {
      console.error("Parent camera access request failed:", error);
      return response.status(500).json({ message: "Unable to request camera access right now." });
    }
  };
}