import type { Request, Response } from "express";
import { unlink } from "node:fs/promises";
import multer from "multer";
import type { SendProviderEmailOtpUseCase } from "../../application/use-cases/send-provider-email-otp.usecase.js";
import type { SubmitProviderRegistrationUseCase } from "../../application/use-cases/submit-provider-registration.usecase.js";
import type { VerifyProviderEmailOtpUseCase } from "../../application/use-cases/verify-provider-email-otp.usecase.js";
import {
  providerApplicationSchema,
  providerEmailOtpSchema,
  providerEmailSchema,
} from "../Validators/provider-registration.validation.js";
import { uploadedProviderDocuments } from "../middleware/upload-provider-documents.js";

export class ProviderRegistrationController {
  constructor(
    private readonly sendEmailOtp: SendProviderEmailOtpUseCase,
    private readonly verifyEmailOtp: VerifyProviderEmailOtpUseCase,
    private readonly submitRegistration: SubmitProviderRegistrationUseCase,
  ) {}

  sendOtp = async (request: Request, response: Response) => {
    const parsed = providerEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "A valid email address is required.",
        errors: parsed.error.issues,
      });
    }

    try {
      const result = await this.sendEmailOtp.execute(parsed.data.email);
      return response.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "OTP_SEND_RATE_LIMITED") {
        return response.status(429).json({
          message: "Please wait before requesting another verification code.",
        });
      }
      if (error instanceof Error && error.message === "EMAIL_ALREADY_VERIFIED") {
        return response.status(409).json({ message: "This email is already verified." });
      }
      if (error instanceof Error && error.message === "SMTP_CONFIGURATION_MISSING") {
        return response.status(503).json({
          message: "Email delivery is not configured on the server.",
        });
      }

      console.error("Provider email OTP send failed:", error);
      return response.status(500).json({
        message: "Unable to send a verification code right now.",
      });
    }
  };

  verifyOtp = (request: Request, response: Response) => {
    const parsed = providerEmailOtpSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Provide a valid email address and six-digit verification code.",
        errors: parsed.error.issues,
      });
    }

    try {
      return response.status(200).json(this.verifyEmailOtp.execute(parsed.data));
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "OTP_INVALID_OR_EXPIRED") {
        return response.status(400).json({
          message: "The verification code is invalid or expired. Request a new code.",
        });
      }
      console.error("Provider email OTP verification failed:", error);
      return response.status(500).json({
        message: "Unable to verify this email right now.",
      });
    }
  };

  submit = async (request: Request, response: Response) => {
    const files = uploadedProviderDocuments(request.files);
    const fields =
      request.files && !Array.isArray(request.files) ? request.files : {};
    const tradeLicense = fields?.tradeLicense?.[0];
    const supportingDocuments = fields?.supportingDocuments ?? [];
    const parsedApplication = this.parseApplication(request.body?.application);

    if (!parsedApplication.success) {
      if (!(await this.cleanUploadedFiles(files, response))) {
        return;
      }
      return response.status(400).json({
        message: "Please provide valid childcare application details.",
        errors: parsedApplication.error.issues,
      });
    }
    if (!tradeLicense) {
      if (!(await this.cleanUploadedFiles(files, response))) {
        return;
      }
      return response.status(400).json({
        message: "A trade licence is required.",
      });
    }

    try {
      const result = await this.submitRegistration.execute({
        application: parsedApplication.data,
        tradeLicense,
        supportingDocuments,
      });
      return response.status(201).json(result);
    } catch (error: unknown) {
      if (!(await this.cleanUploadedFiles(files, response))) {
        return;
      }

      if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
        return response.status(403).json({
          message: "Verify the owner email address before submitting the application.",
        });
      }
      if (error instanceof Error && error.message === "INVALID_DOCUMENT_CONTENT") {
        return response.status(400).json({
          message: "A document does not match its declared PDF, JPG or PNG format.",
        });
      }
      if (error instanceof Error && error.message === "CLOUDINARY_CONFIGURATION_MISSING") {
        return response.status(503).json({
          message: "Cloudinary storage is not configured on the server.",
        });
      }
      if (error instanceof Error && error.message === "CLOUDINARY_UPLOAD_FAILED") {
        console.error("Cloudinary provider document upload failed:", error.cause);
        return response.status(502).json({
          message: "Unable to upload documents to Cloudinary. Please try again.",
        });
      }
      if (
        error instanceof Error &&
        error.message === "PROVIDER_DOCUMENT_TEMP_CLEANUP_FAILED"
      ) {
        console.error("Unable to remove a provider document temporary file:", error.cause);
        return response.status(500).json({
          message: "A temporary document could not be cleaned up after upload.",
        });
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return response.status(409).json({
          message: "An application already exists for this owner email address.",
        });
      }

      console.error("Provider registration submission failed:", error);
      return response.status(500).json({
        message: "Unable to submit this application right now.",
      });
    }
  };

  handleUploadError = (
    error: unknown,
    request: Request,
    response: Response,
  ) => {
    void this.removeUploadedFiles(uploadedProviderDocuments(request.files))
      .then(() => {
        if (error instanceof multer.MulterError) {
          const tooLarge = error.code === "LIMIT_FILE_SIZE";
          return response.status(tooLarge ? 413 : 400).json({
            message: tooLarge
              ? "Each document must be 10 MB or smaller."
              : "The uploaded documents exceed the allowed number or request fields.",
          });
        }
        if (error instanceof Error && error.message === "INVALID_DOCUMENT_TYPE") {
          return response.status(400).json({
            message: "Documents must be PDF, JPG or PNG files.",
          });
        }
        console.error("Provider document upload failed:", error);
        return response.status(500).json({
          message: "Unable to process the uploaded documents.",
        });
      })
      .catch((cleanupError: unknown) => {
        console.error("Unable to clean up a failed provider document upload:", cleanupError);
        response.status(500).json({
          message: "Unable to process the uploaded documents.",
        });
      });
  };

  private parseApplication(value: unknown) {
    if (typeof value !== "string") {
      return providerApplicationSchema.safeParse(undefined);
    }

    try {
      return providerApplicationSchema.safeParse(JSON.parse(value));
    } catch {
      return providerApplicationSchema.safeParse(undefined);
    }
  }

  private async removeUploadedFiles(files: Express.Multer.File[]): Promise<void> {
    const results = await Promise.allSettled(files.map((file) => unlink(file.path)));
    const failures: unknown[] = [];
    for (const result of results) {
      if (
        result.status === "rejected" &&
        !(typeof result.reason === "object" &&
          result.reason !== null &&
          "code" in result.reason &&
          result.reason.code === "ENOENT")
      ) {
        failures.push(result.reason);
      }
    }
    if (failures.length > 0) {
      throw new Error("PROVIDER_DOCUMENT_CLEANUP_FAILED", { cause: failures });
    }
  }

  private async cleanUploadedFiles(
    files: Express.Multer.File[],
    response: Response,
  ): Promise<boolean> {
    try {
      await this.removeUploadedFiles(files);
      return true;
    } catch (error: unknown) {
      console.error("Unable to clean up provider document temporary files:", error);
      response.status(500).json({
        message: "Unable to clean up temporary uploaded documents.",
      });
      return false;
    }
  }
}
