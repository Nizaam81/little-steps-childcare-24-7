import { Schema, model } from "mongoose";

const availabilitySlotSchema = new Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const centrePhotoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image"], default: "image" },
  },
  { timestamps: true },
);

const providerWorkspaceSchema = new Schema(
  {
    centreId: { type: Schema.Types.ObjectId, ref: "ProviderRegistration", required: true, unique: true },
    hourlyPrice: { type: Number, min: 0, default: 0 },
    description: { type: String, maxlength: 3000, default: "" },
    availableDays: { type: [String], default: [] },
    availabilitySlots: { type: [availabilitySlotSchema], default: [] },
    photos: { type: [centrePhotoSchema], default: [] },
  },
  { timestamps: true },
);

export const ProviderWorkspaceModel = model(
  "ProviderWorkspace",
  providerWorkspaceSchema,
);
