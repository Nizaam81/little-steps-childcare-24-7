import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const phoneSchema = z.string().regex(/^\d{10}$/);
const priceSchema = z.union([
  z.number().finite().nonnegative(),
  z.literal(""),
]);

export const providerEmailSchema = z.object({
  email: emailSchema,
});

export const providerEmailOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/),
});

export const providerApplicationSchema = z
  .object({
    ownerName: z.string().trim().min(2).max(120),
    ownerEmail: emailSchema,
    ownerPhone: phoneSchema,
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    centreName: z.string().trim().min(2).max(160),
    address: z.string().trim().min(5).max(500),
    district: z.string().trim().min(1).max(120),
    centreEmail: emailSchema,
    centrePhone: phoneSchema,
    ageGroups: z
      .array(
        z.enum([
          "Infants (0–1)",
          "Toddlers (1–3)",
          "Preschool (3–5)",
          "School age (5+)",
        ]),
      )
      .min(1),
    careTypes: z.array(z.enum(["Daily care", "Monthly care"])).min(1),
    capacity: z.number().int().positive(),
    openingTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    closingTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    dailyPrice: priceSchema,
    monthlyPrice: priceSchema,
  })
  .superRefine((application, context) => {
    if (application.openingTime >= application.closingTime) {
      context.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time must be later than opening time.",
      });
    }
    if (
      application.careTypes.includes("Daily care") &&
      application.dailyPrice === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["dailyPrice"],
        message: "A daily price is required for daily care.",
      });
    }
    if (
      application.careTypes.includes("Monthly care") &&
      application.monthlyPrice === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["monthlyPrice"],
        message: "A monthly price is required for monthly care.",
      });
    }
    if (
      application.dailyPrice === "" &&
      application.monthlyPrice === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["dailyPrice"],
        message: "Enter at least one price.",
      });
    }
  });
