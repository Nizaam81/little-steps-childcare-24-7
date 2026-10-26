import { Schema, model } from "mongoose";

const documentSchema = new Schema(
  {
    storedName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
  },
  { _id: false },
);

const providerRegistrationSchema = new Schema(
  {
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    ownerPhone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    centreName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    centreEmail: { type: String, required: true, lowercase: true, trim: true },
    centrePhone: { type: String, required: true, trim: true },
    ageGroups: { type: [String], required: true },
    careTypes: { type: [String], required: true },
    capacity: { type: Number, required: true },
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
    dailyPrice: { type: Schema.Types.Mixed, required: true },
    monthlyPrice: { type: Schema.Types.Mixed, required: true },
    tradeLicense: { type: documentSchema, required: true },
    supportingDocuments: { type: [documentSchema], default: [] },
    status: {
      type: String,
      enum: ["pending_verification", "approved", "rejected", "corrections_requested"],
      default: "pending_verification",
      required: true,
    },
    reviewNotes: { type: String, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

export const ProviderRegistrationModel = model(
  "ProviderRegistration",
  providerRegistrationSchema,
);
