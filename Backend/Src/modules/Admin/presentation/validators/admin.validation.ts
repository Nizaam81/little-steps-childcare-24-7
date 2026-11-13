import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export const providerStatusFilterSchema = z.object({
  status: z
    .enum([
      "pending_verification",
      "approved",
      "rejected",
      "corrections_requested",
    ])
    .optional(),
});

export const providerReviewSchema = z
  .object({
    status: z.enum(["approved", "rejected", "corrections_requested"]),
    reviewNotes: z.string().trim().max(1000).default(""),
  })
  .superRefine((data, context) => {
    if (
      data.status !== "approved" &&
      data.reviewNotes.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewNotes"],
        message: "Add a reason when rejecting or requesting corrections.",
      });
    }
  });

export const providerApplicationIdSchema = z.object({
  applicationId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const providerApplicationDocumentSchema = providerApplicationIdSchema.extend({
  publicId: z.string().min(1).max(255),
});

export const adminEntityIdSchema = z.object({
  entityId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const adminActiveStatusSchema = z.object({
  isActive: z.boolean(),
});
