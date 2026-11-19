import { Schema, model } from "mongoose";

const caregiverProfileSchema = new Schema(
  {
    centreId: { type: Schema.Types.ObjectId, ref: "ProviderRegistration", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    experience: { type: String, required: true, trim: true, maxlength: 100 },
    photoUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CaregiverProfileModel = model(
  "CaregiverProfile",
  caregiverProfileSchema,
);
