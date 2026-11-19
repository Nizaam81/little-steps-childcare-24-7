import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { readFile, unlink } from "node:fs/promises";
import { z } from "zod";
import { ParentNotificationModel } from "../../../parents/infrastructure/persistence/parent-notification.model.js";
import { BookingRequestModel } from "../../infrastructure/persistence/booking-request.model.js";
import { CaregiverProfileModel } from "../../infrastructure/persistence/caregiver-profile.model.js";
import { ProviderWorkspaceModel } from "../../infrastructure/persistence/provider-workspace.model.js";
import { ProviderRegistrationModel } from "../../infrastructure/persistence/provider-registration.model.js";
import {
  deleteProviderDocument,
  uploadDaycarePhoto,
} from "../../infrastructure/services/cloudinary-provider-document-storage.js";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(300),
  district: z.string().trim().min(2).max(100),
  openingTime: z.string().trim().max(20),
  closingTime: z.string().trim().max(20),
  capacity: z.number().int().min(1).max(10000),
  hourlyPrice: z.number().min(0).max(100000),
  dailyPrice: z.number().min(0).max(1000000),
  monthlyPrice: z.number().min(0).max(1000000),
  ageGroups: z.array(z.string().trim().min(1).max(50)).max(20),
  careTypes: z.array(z.string().trim().min(1).max(50)).max(20),
  availabilitySlots: z.array(z.object({
    startTime: z.string().trim().min(1).max(20),
    endTime: z.string().trim().min(1).max(20),
  })).max(50),
  availableDays: z.array(z.string().trim().min(1).max(20)).max(7),
  description: z.string().trim().max(3000),
  isAcceptingBookings: z.boolean(),
});

const caregiverSchema = z.object({
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100),
  experience: z.string().trim().min(1).max(100),
  photoUrl: z.string().trim().url().max(2000).or(z.literal("")).default(""),
});

const bookingStatusSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

function providerId(request: Request): string {
  if (!request.auth || request.auth.role !== "provider") {
    throw new Error("PROVIDER_AUTHENTICATION_REQUIRED");
  }
  return request.auth.sub;
}

export class ProviderWorkspaceController {
  getWorkspace = async (request: Request, response: Response) => {
    try {
      const registration = await ProviderRegistrationModel.findOne({
        _id: providerId(request),
        status: "approved",
        isActive: { $ne: false },
      }).select("_id centreName address district ageGroups careTypes capacity openingTime closingTime dailyPrice monthlyPrice isAcceptingBookings");
      if (!registration) return response.status(404).json({ message: "Your approved daycare centre was not found." });

      const [saved, caregivers, bookings] = await Promise.all([
        ProviderWorkspaceModel.findOne({ centreId: registration._id }),
        CaregiverProfileModel.find({ centreId: registration._id, isActive: true }).sort({ createdAt: -1 }),
        BookingRequestModel.find({ centreId: registration._id })
          .populate<{ parentId: { _id: Types.ObjectId; fullName: string } | null }>({
            path: "parentId",
            select: "fullName",
          })
          .sort({ createdAt: -1 }),
      ]);
      return response.status(200).json({
        workspace: {
          availableDays: saved?.availableDays ?? [],
          photos: (saved?.photos ?? []).map((photo) => ({
            id: photo._id.toString(),
            url: photo.url,
          })),

          profile: {
            name: registration.centreName,
            address: registration.address,
            district: registration.district,
            openingTime: registration.openingTime,
            closingTime: registration.closingTime,
            capacity: registration.capacity,
            hourlyPrice: saved?.hourlyPrice ?? 0,
            dailyPrice: Number(registration.dailyPrice) || 0,
            monthlyPrice: Number(registration.monthlyPrice) || 0,
            isAcceptingBookings: registration.isAcceptingBookings,
            ageGroups: registration.ageGroups,
            careTypes: registration.careTypes,
            availabilitySlots: saved?.availabilitySlots ?? [],
            availableDays: saved?.availableDays ?? [],
            description: saved?.description ?? "",
          },
          caregivers: caregivers.map((item) => ({
            id: item.id,
            name: item.name,
            role: item.role,
            experience: item.experience,
            photoUrl: item.photoUrl,
          })),
          bookings: bookings.flatMap((item) => {
            const parent = item.parentId;
            if (!parent) return [];
            return {
              id: item.id,
              parentId: parent._id.toString(),
              parentName: parent.fullName,
              childName: item.childName,
              carePlan: item.carePlan,
              requestedDate: item.requestedDate,
              bookingStartDate: item.bookingStartDate,
              bookingEndDate: item.bookingEndDate,
              cameraAccessStatus: item.cameraAccessStatus,
              cameraAccessRequestedAt: item.cameraAccessRequestedAt,
              note: item.note,
              status: item.status,
            };
          }),
        },
      });
    } catch (error: unknown) {
      console.error("Provider workspace retrieval failed:", error);
      return response.status(500).json({ message: "Unable to load your daycare workspace right now." });
    }
  };

  addPhoto = async (request: Request, response: Response) => {
    const file = request.file;
    if (!file) return response.status(400).json({ message: "Choose a daycare photo to upload." });

    let uploaded: Awaited<ReturnType<typeof uploadDaycarePhoto>> | null = null;
    try {
      const contents = await readFile(file.path);
      if (contents.length === 0) {
        return response.status(400).json({ message: "The uploaded image is empty." });
      }
      const isJpeg = file.mimetype === "image/jpeg" &&
        contents.length >= 3 &&
        contents[0] === 0xff &&
        contents[1] === 0xd8 &&
        contents[2] === 0xff;
      const isPng = file.mimetype === "image/png" &&
        contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp = file.mimetype === "image/webp" &&
        contents.subarray(0, 4).toString("ascii") === "RIFF" &&
        contents.subarray(8, 12).toString("ascii") === "WEBP";
      if (!isJpeg && !isPng && !isWebp) {
        return response.status(400).json({ message: "This file is not a valid JPG, PNG or WebP image." });
      }

      const centreId = providerId(request);
      const centre = await ProviderRegistrationModel.findOne({
        _id: centreId,
        status: "approved",
        isActive: { $ne: false },
      }).select("_id");
      if (!centre) return response.status(404).json({ message: "Your approved daycare centre was not found." });

      const workspace = await ProviderWorkspaceModel.findOneAndUpdate(
        { centreId: centre._id },
        { $setOnInsert: { centreId: centre._id } },
        { upsert: true, returnDocument: "after" },
      ).select("photos");
      if (!workspace) throw new Error("DAYCARE_WORKSPACE_CREATE_FAILED");
      if (workspace.photos.length >= 4) {
        return response.status(409).json({ message: "A daycare can have up to four photos. Remove a photo before adding another." });
      }

      uploaded = await uploadDaycarePhoto(file.path);
      const photoId = new Types.ObjectId();
      const update = await ProviderWorkspaceModel.updateOne(
        {
          centreId: centre._id,
          "photos.3": { $exists: false },
        },
        {
          $push: {
            photos: {
              _id: photoId,
              url: uploaded.secure_url,
              publicId: uploaded.public_id,
              resourceType: "image",
            },
          },
        },
        { runValidators: true },
      );
      if (!update.acknowledged || update.matchedCount !== 1) {
        if (update.matchedCount === 0) {
          throw new Error("DAYCARE_PHOTO_LIMIT_REACHED");
        }
        throw new Error("DAYCARE_PHOTO_SAVE_FAILED");
      }

      return response.status(201).json({
        photo: { id: photoId.toString(), url: uploaded.secure_url },
      });
    } catch (error: unknown) {
      if (uploaded) {
        try {
          await deleteProviderDocument(uploaded.public_id, "image");
        } catch (cleanupError: unknown) {
          console.error("Unable to clean up an unlinked daycare photo from Cloudinary:", cleanupError);
        }
      }
      if (error instanceof Error && error.message === "CLOUDINARY_CONFIGURATION_MISSING") {
        return response.status(503).json({ message: "Photo storage is not configured on the server." });
      }
      if (error instanceof Error && error.message === "CLOUDINARY_UPLOAD_FAILED") {
        console.error("Cloudinary daycare photo upload failed:", error.cause);
        return response.status(502).json({ message: "Unable to upload this photo. Please try again." });
      }
      if (error instanceof Error && error.message === "DAYCARE_PHOTO_LIMIT_REACHED") {
        return response.status(409).json({ message: "A daycare can have up to four photos. Remove a photo before adding another." });
      }
      console.error("Daycare photo upload failed:", error);
      return response.status(500).json({ message: "Unable to save this daycare photo right now." });
    } finally {
      try {
        await unlink(file.path);
      } catch (error: unknown) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
          console.error("Unable to remove a temporary daycare photo:", error);
        }
      }
    }
  };

  removePhoto = async (request: Request, response: Response) => {
    const { photoId } = request.params;
    if (!isValidObjectId(photoId)) return response.status(400).json({ message: "The daycare photo ID is invalid." });
    try {
      const centreId = providerId(request);
      const workspace = await ProviderWorkspaceModel.findOne({
        centreId,
        "photos._id": photoId,
      }).select("photos");
      const photo = workspace?.photos.find((item) => item._id.toString() === photoId);
      if (!workspace || !photo) return response.status(404).json({ message: "This daycare photo was not found." });

      await deleteProviderDocument(photo.publicId, "image");
      await ProviderWorkspaceModel.updateOne(
        { centreId },
        { $pull: { photos: { _id: photoId } } },
      );
      return response.status(200).json({ removed: true });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "CLOUDINARY_CONFIGURATION_MISSING") {
        return response.status(503).json({ message: "Photo storage is not configured on the server." });
      }
      console.error("Daycare photo removal failed:", error);
      return response.status(500).json({ message: "Unable to remove this daycare photo right now." });
    }
  };

  updateProfile = async (request: Request, response: Response) => {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: "Provide valid daycare profile details.", errors: parsed.error.issues });
    try {
      const id = providerId(request);
      const registration = await ProviderRegistrationModel.findOneAndUpdate(
        { _id: id, status: "approved", isActive: { $ne: false } },
        {
          $set: {
            centreName: parsed.data.name,
            address: parsed.data.address,
            district: parsed.data.district,
            openingTime: parsed.data.openingTime,
            closingTime: parsed.data.closingTime,
            capacity: parsed.data.capacity,
            dailyPrice: parsed.data.dailyPrice,
            monthlyPrice: parsed.data.monthlyPrice,
            isAcceptingBookings: parsed.data.isAcceptingBookings,
            ageGroups: parsed.data.ageGroups,
            careTypes: parsed.data.careTypes,
          },
        },
        { returnDocument: "after", runValidators: true },
      );
      if (!registration) return response.status(404).json({ message: "Your approved daycare centre was not found." });
      await ProviderWorkspaceModel.updateOne(
        { centreId: registration._id },
        {
          $set: {
            hourlyPrice: parsed.data.hourlyPrice,
            description: parsed.data.description,
            availableDays: parsed.data.availableDays,
            availabilitySlots: parsed.data.availabilitySlots,
          },
        },
        { upsert: true, runValidators: true },
      );
      return response.status(200).json({ saved: true });
    } catch (error: unknown) {
      console.error("Provider daycare profile update failed:", error);
      return response.status(500).json({ message: "Unable to save daycare profile changes right now." });
    }
  };

  addCaregiver = async (request: Request, response: Response) => {
    const parsed = caregiverSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: "Provide valid caregiver details.", errors: parsed.error.issues });
    try {
      const centre = await ProviderRegistrationModel.findOne({
        _id: providerId(request),
        status: "approved",
        isActive: { $ne: false },
      }).select("_id");
      if (!centre) return response.status(404).json({ message: "Your approved daycare centre was not found." });
      const caregiver = await CaregiverProfileModel.create({
        ...parsed.data,
        centreId: centre._id,
      });
      return response.status(201).json({
        caregiver: {
          id: caregiver.id,
          name: caregiver.name,
          role: caregiver.role,
          experience: caregiver.experience,
          photoUrl: caregiver.photoUrl,
        },
      });
    } catch (error: unknown) {
      console.error("Caregiver creation failed:", error);
      return response.status(500).json({ message: "Unable to add this caregiver right now." });
    }
  };

  updateCaregiver = async (request: Request, response: Response) => {
    const caregiverId = request.params.caregiverId;
    const parsed = caregiverSchema.safeParse(request.body);
    if (!isValidObjectId(caregiverId) || !parsed.success) {
      return response.status(400).json({ message: "Provide valid caregiver details." });
    }
    try {
      const caregiver = await CaregiverProfileModel.findOne({
        _id: caregiverId,
        centreId: providerId(request),
        isActive: true,
      });
      if (!caregiver) return response.status(404).json({ message: "Caregiver profile was not found." });
      caregiver.set(parsed.data);
      await caregiver.save();
      return response.status(200).json({ caregiver });
    } catch (error: unknown) {
      console.error("Caregiver update failed:", error);
      return response.status(500).json({ message: "Unable to update this caregiver right now." });
    }
  };

  removeCaregiver = async (request: Request, response: Response) => {
    const caregiverId = request.params.caregiverId;
    if (!isValidObjectId(caregiverId)) return response.status(400).json({ message: "The caregiver ID is invalid." });
    try {
      const caregiver = await CaregiverProfileModel.findOneAndUpdate(
        { _id: caregiverId, centreId: providerId(request), isActive: true },
        { $set: { isActive: false } },
      );
      if (!caregiver) return response.status(404).json({ message: "Caregiver profile was not found." });
      return response.status(204).send();
    } catch (error: unknown) {
      console.error("Caregiver removal failed:", error);
      return response.status(500).json({ message: "Unable to remove this caregiver right now." });
    }
  };

  listBookings = async (request: Request, response: Response) => {
    try {
      const bookings = await BookingRequestModel.find({ centreId: providerId(request) })
        .populate<{ parentId: { _id: Types.ObjectId; fullName: string } | null }>({
          path: "parentId",
          select: "fullName",
        })
        .sort({ createdAt: -1 });
      return response.status(200).json({
        bookings: bookings.flatMap((item) => {
          const parent = item.parentId;
          if (!parent) return [];
          return {
            id: item.id,
            parentId: parent._id.toString(),
            parentName: parent.fullName,
            childName: item.childName,
            carePlan: item.carePlan,
            requestedDate: item.requestedDate,
            note: item.note,
            status: item.status,
          };
        }),
      });
    } catch (error: unknown) {
      console.error("Provider booking retrieval failed:", error);
      return response.status(500).json({ message: "Unable to load booking requests right now." });
    }
  };

  updateBooking = async (request: Request, response: Response) => {
    const bookingId = request.params.bookingId;
    const parsed = bookingStatusSchema.safeParse(request.body);
    if (!isValidObjectId(bookingId) || !parsed.success) return response.status(400).json({ message: "Provide a valid booking decision." });
    try {
      const currentBooking = await BookingRequestModel.findOne({
        _id: bookingId,
        centreId: providerId(request),
        status: "pending",
      });
      if (!currentBooking) return response.status(404).json({ message: "This pending request was not found." });
      if (
        parsed.data.status === "accepted" &&
        currentBooking.bookingStartDate &&
        currentBooking.bookingEndDate &&
        await BookingRequestModel.exists({
          _id: { $ne: currentBooking._id },
          parentId: currentBooking.parentId,
          status: "accepted",
          bookingStartDate: { $lte: currentBooking.bookingEndDate },
          bookingEndDate: { $gte: currentBooking.bookingStartDate },
        })
      ) {
        return response.status(409).json({
          message: "The parent already has an accepted booking during this period.",
        });
      }
      const booking = await BookingRequestModel.findOneAndUpdate(
        { _id: bookingId, centreId: providerId(request), status: "pending" },
        { $set: { status: parsed.data.status } },
        { returnDocument: "after" },
      );
      if (!booking) return response.status(404).json({ message: "This pending request was not found." });
      const centre = await ProviderRegistrationModel.findById(booking.centreId).select("centreName");
      await ParentNotificationModel.create({
        parentId: booking.parentId,
        title: parsed.data.status === "accepted" ? "Daycare request accepted" : "Daycare request declined",
        message: `${centre?.centreName ?? "The daycare"} ${parsed.data.status} your care request for ${booking.childName}.`,
        type: "booking",
        relatedId: booking.id,
      });
      return response.status(200).json({ bookingId: booking.id, status: booking.status });
    } catch (error: unknown) {
      console.error("Provider booking decision failed:", error);
      return response.status(500).json({ message: "Unable to update this booking request right now." });
    }
  };

  deleteRejectedBooking = async (request: Request, response: Response) => {
    const bookingId = request.params.bookingId;
    if (!isValidObjectId(bookingId)) {
      return response.status(400).json({ message: "The booking request ID is invalid." });
    }
    try {
      const booking = await BookingRequestModel.findOneAndDelete({
        _id: bookingId,
        centreId: providerId(request),
        status: "rejected",
      });
      if (!booking) {
        return response.status(404).json({ message: "This rejected booking request was not found." });
      }
      return response.status(204).send();
    } catch (error: unknown) {
      console.error("Rejected booking request deletion failed:", error);
      return response.status(500).json({ message: "Unable to delete this rejected booking request right now." });
    }
  };

  updateCameraAccess = async (request: Request, response: Response) => {
    const bookingId = request.params.bookingId;
    const parsed = z.object({ status: z.enum(["approved", "rejected"]) }).safeParse(request.body);
    if (!isValidObjectId(bookingId) || !parsed.success) {
      return response.status(400).json({ message: "Provide a valid camera-access decision." });
    }
    try {
      const booking = await BookingRequestModel.findOneAndUpdate(
        {
          _id: bookingId,
          centreId: providerId(request),
          status: "accepted",
          cameraAccessStatus: "pending",
        },
        { $set: { cameraAccessStatus: parsed.data.status } },
        { returnDocument: "after" },
      );
      if (!booking) return response.status(404).json({ message: "This pending camera-access request was not found." });

      const centre = await ProviderRegistrationModel.findById(booking.centreId).select("centreName");
      await ParentNotificationModel.create({
        parentId: booking.parentId,
        title: parsed.data.status === "approved" ? "Camera access request approved" : "Camera access request declined",
        message: `${centre?.centreName ?? "The daycare"} ${parsed.data.status} your camera-access request. Contact the centre for access details.`,
        type: "camera_access",
        relatedId: booking.id,
      });
      return response.status(200).json({ bookingId: booking.id, status: booking.cameraAccessStatus });
    } catch (error: unknown) {
      console.error("Provider camera-access decision failed:", error);
      return response.status(500).json({ message: "Unable to update this camera-access request right now." });
    }
  };
}
