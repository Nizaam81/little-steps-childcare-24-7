import { Schema, model } from "mongoose";

const bookingRequestSchema = new Schema(
  {
    centreId: { type: Schema.Types.ObjectId, ref: "ProviderRegistration", required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "ParentRegistration", required: true, index: true },
    childName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    carePlan: { type: String, required: true, trim: true, maxlength: 100 },
    requestedDate: { type: Date, required: true },
    bookingStartDate: { type: Date, required: true, index: true },
    bookingEndDate: { type: Date, required: true, index: true },
    cameraAccessStatus: {
      type: String,
      enum: ["not_requested", "pending", "approved", "rejected"],
      default: "not_requested",
    },
    cameraAccessRequestedAt: { type: Date },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["pending", "accepted", "rejected", "canceled"], default: "pending", index: true },
  },
  { timestamps: true },
);

export const BookingRequestModel = model(
  "BookingRequest",
  bookingRequestSchema,
);
