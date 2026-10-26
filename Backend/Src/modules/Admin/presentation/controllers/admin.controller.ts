import type { Request, Response } from "express";
import type { AdminSessionTokenService } from "../../application/services/admin-session-token.service.js";
import type { GetProviderApplicationDocumentUseCase } from "../../application/use-cases/get-provider-application-document.usecase.js";
import type { ListProviderApplicationsUseCase } from "../../application/use-cases/list-provider-applications.usecase.js";
import type { LoginAdminUseCase } from "../../application/use-cases/login-admin.usecase.js";
import type { ReviewProviderApplicationUseCase } from "../../application/use-cases/review-provider-application.usecase.js";
import {
  adminLoginSchema,
  providerApplicationIdSchema,
  providerReviewSchema,
  providerStatusFilterSchema,
} from "../validators/admin.validation.js";

export class AdminController {
  constructor(
    private readonly loginAdmin: LoginAdminUseCase,
    private readonly tokens: AdminSessionTokenService,
    private readonly listApplications: ListProviderApplicationsUseCase,
    private readonly reviewApplication: ReviewProviderApplicationUseCase,
    private readonly getApplicationDocument: GetProviderApplicationDocumentUseCase,
  ) {}

  login = async (request: Request, response: Response) => {
    const parsed = adminLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Provide a valid admin email address and password.",
        errors: parsed.error.issues,
      });
    }

    try {
      const result = await this.loginAdmin.execute(parsed.data);
      const token = this.tokens.issue({
        adminId: result.admin.id,
        email: result.admin.email,
        expiresInSeconds: result.expiresInSeconds,
      });
      return response.status(200).json({
        token,
        admin: result.admin,
        expiresInSeconds: result.expiresInSeconds,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "INVALID_ADMIN_CREDENTIALS"
      ) {
        return response.status(401).json({
          message: "Invalid email or password.",
        });
      }

      console.error("Admin login failed:", error);
      return response.status(500).json({
        message: "Unable to sign in right now.",
      });
    }
  };

  listProviderApplications = async (request: Request, response: Response) => {
    const parsed = providerStatusFilterSchema.safeParse(request.query);
    if (!parsed.success) {
      return response.status(400).json({
        message: "The requested application status is invalid.",
        errors: parsed.error.issues,
      });
    }

    try {
      const applications = await this.listApplications.execute(
        parsed.data.status,
      );
      return response.status(200).json({ applications });
    } catch (error: unknown) {
      console.error("Admin provider application listing failed:", error);
      return response.status(500).json({
        message: "Unable to load provider applications right now.",
      });
    }
  };

  reviewProviderApplication = async (
    request: Request,
    response: Response,
  ) => {
    const params = providerApplicationIdSchema.pick({
      applicationId: true,
    }).safeParse(request.params);
    const body = providerReviewSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return response.status(400).json({
        message: "Provide a valid application ID, decision, and review note.",
        errors: [
          ...(!params.success ? params.error.issues : []),
          ...(!body.success ? body.error.issues : []),
        ],
      });
    }
    if (!request.admin) {
      return response.status(401).json({ message: "Admin authentication is required." });
    }

    try {
      const result = await this.reviewApplication.execute({
        applicationId: params.data.applicationId,
        status: body.data.status,
        reviewNotes: body.data.reviewNotes,
        adminId: request.admin.id,
      });
      return response.status(200).json(result);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "APPLICATION_NOT_REVIEWABLE"
      ) {
        return response.status(409).json({
          message: "This application does not exist or is no longer reviewable.",
        });
      }

      console.error("Admin provider application review failed:", error);
      return response.status(500).json({
        message: "Unable to update this application right now.",
      });
    }
  };

  downloadProviderDocument = async (
    request: Request,
    response: Response,
  ) => {
    const parsed = providerApplicationIdSchema.safeParse(request.params);
    if (!parsed.success) {
      return response.status(400).json({
        message: "The application or document reference is invalid.",
        errors: parsed.error.issues,
      });
    }

    try {
      const document = await this.getApplicationDocument.execute(parsed.data);
      if (!document) {
        return response.status(404).json({
          message: "The requested application document was not found.",
        });
      }

      response.set("Cache-Control", "private, no-store");
      response.set("X-Content-Type-Options", "nosniff");
      response.type(document.mimeType);
      return response.download(document.path, document.originalName, (error) => {
        if (!error || response.headersSent) {
          if (error) {
            console.error("Provider document download failed:", error);
          }
          return;
        }

        console.error("Provider document download failed:", error);
        if ("code" in error && error.code === "ENOENT") {
          response.status(404).json({
            message: "The stored application document is unavailable.",
          });
          return;
        }

        response.status(500).json({
          message: "Unable to retrieve the application document.",
        });
      });
    } catch (error: unknown) {
      console.error("Admin provider document retrieval failed:", error);
      return response.status(500).json({
        message: "Unable to retrieve the application document.",
      });
    }
  };
}
