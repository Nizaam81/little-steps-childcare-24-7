import type { Request, Response } from "express";
import type { VerifyRegistrationOtpUseCase } from "../../application/use-cases/verify-registration-otp.usecase.js";
import { verifyRegistrationOtpSchema } from "../validators/parent-signup.validation.js";

export class VerifyOtpController {
  constructor(
    private readonly verifyRegistrationOtp: VerifyRegistrationOtpUseCase,
  ) {}

  verifyOtp = async (req: Request, res: Response) => {
    const parsed = verifyRegistrationOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Provide a valid email, six-digit OTP, and password of at least 8 characters.",
        errors: parsed.error.issues,
      });
    }

    try {
      const result = await this.verifyRegistrationOtp.execute(parsed.data);
      return res.status(200).json(result);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "OTP_INVALID_OR_EXPIRED"
      ) {
        return res.status(400).json({
          message: "The OTP is invalid or expired. Request a new code.",
        });
      }

      if (
        error instanceof Error &&
        error.message === "PENDING_REGISTRATION_NOT_FOUND"
      ) {
        return res.status(400).json({
          message: "This registration has expired or is already complete.",
        });
      }

      console.error("OTP verification failed:", error);
      return res.status(500).json({
        message: "Unable to verify this registration right now.",
      });
    }
  };
}
