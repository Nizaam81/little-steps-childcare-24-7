import type { Request, Response } from "express";
import type { AuthTokenService } from "../../../../shared/services/auth-token.service.js";
import type { GetProviderApplicationDocumentUseCase } from "../../application/use-cases/get-provider-application-document.usecase.js";
import type { ListProviderApplicationsUseCase } from "../../application/use-cases/list-provider-applications.usecase.js";
import type { LoginAdminUseCase } from "../../application/use-cases/login-admin.usecase.js";
import type { ReviewProviderApplicationUseCase } from "../../application/use-cases/review-provider-application.usecase.js";
import type { ParentRegistrationRepository } from "../../../parents/domain/repositories/parent-registration.repository.js";
import type { ProviderRegistrationRepository } from "../../../childcare/domain/repositories/provider-registration.repository.js";
import {
  adminActiveStatusSchema,
  adminEntityIdSchema,
  adminLoginSchema,
  providerApplicationDocumentSchema,
  providerApplicationIdSchema,
  providerReviewSchema,
  providerStatusFilterSchema,
} from "../validators/admin.validation.js";

export class AdminController {
  constructor(
    private readonly loginAdmin: LoginAdminUseCase,
    private readonly tokens: AuthTokenService,
    private readonly listApplications: ListProviderApplicationsUseCase,
    private readonly reviewApplication: ReviewProviderApplicationUseCase,
    private readonly getApplicationDocument: GetProviderApplicationDocumentUseCase,
    private readonly providerRegistrations: ProviderRegistrationRepository,
    private readonly parentRegistrations: ParentRegistrationRepository,
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
      const session = await this.tokens.issueSession({
        subject: result.admin.id,
        email: result.admin.email,
        role: "admin",
        accessExpiresInSeconds: result.expiresInSeconds,
      });
      return response.status(200).json({
        ...session,
        token: session.accessToken,
        admin: result.admin,
        expiresInSeconds: session.expiresInSeconds,
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

  logout = async (request: Request, response: Response) => {
    if (!request.auth) {
      return response.status(401).json({ message: "Admin authentication is required." });
    }
    try {
      await this.tokens.revokeSession(request.auth);
      return response.status(200).json({ message: "Logged out successfully." });
    } catch (error: unknown) {
      console.error("Admin logout failed:", error);
      return response.status(500).json({ message: "Unable to log out right now." });
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
    const parsed = providerApplicationDocumentSchema.safeParse({
      ...request.params,
      ...request.query,
    });
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
      return response.redirect(302, document.url);
    } catch (error: unknown) {
      console.error("Admin provider document retrieval failed:", error);
      return response.status(500).json({
        message: "Unable to retrieve the application document.",
      });
    }
  };

  listApprovedCentres = async (_request: Request, response: Response) => {
    try {
      const centres = await this.providerRegistrations.listApprovedCentres();
      return response.status(200).json({ centres });
    } catch (error: unknown) {
      console.error("Admin approved-centre listing failed:", error);
      return response.status(500).json({
        message: "Unable to load approved daycare centres right now.",
      });
    }
  };

  updateCentreStatus = async (request: Request, response: Response) => {
    const params = adminEntityIdSchema.safeParse({
      entityId: request.params.applicationId,
    });
    const body = adminActiveStatusSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return response.status(400).json({
        message: "Provide a valid centre ID and active status.",
      });
    }

    try {
      const updated = await this.providerRegistrations.setCentreActive(
        params.data.entityId,
        body.data.isActive,
      );
      if (!updated) {
        return response.status(404).json({
          message: "The approved daycare centre was not found.",
        });
      }
      return response.status(200).json({ isActive: body.data.isActive });
    } catch (error: unknown) {
      console.error("Admin daycare-centre status update failed:", error);
      return response.status(500).json({
        message: "Unable to update this daycare centre right now.",
      });
    }
  };

  deleteCentre = async (request: Request, response: Response) => {
    const params = adminEntityIdSchema.safeParse({
      entityId: request.params.applicationId,
    });
    if (!params.success) {
      return response.status(400).json({ message: "The centre ID is invalid." });
    }

    try {
      const deleted = await this.providerRegistrations.deleteApprovedCentre(
        params.data.entityId,
      );
      if (!deleted) {
        return response.status(404).json({
          message: "The approved daycare centre was not found.",
        });
      }
      return response.status(204).send();
    } catch (error: unknown) {
      console.error("Admin daycare-centre deletion failed:", error);
      return response.status(500).json({
        message: "Unable to remove this daycare centre right now.",
      });
    }
  };

  listParents = async (_request: Request, response: Response) => {
    try {
      const parents = await this.parentRegistrations.listVerifiedParents();
      return response.status(200).json({ parents });
    } catch (error: unknown) {
      console.error("Admin parent listing failed:", error);
      return response.status(500).json({
        message: "Unable to load registered parents right now.",
      });
    }
  };

  updateParentStatus = async (request: Request, response: Response) => {
    const params = adminEntityIdSchema.safeParse({
      entityId: request.params.parentId,
    });
    const body = adminActiveStatusSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return response.status(400).json({
        message: "Provide a valid parent ID and active status.",
      });
    }

    try {
      const updated = await this.parentRegistrations.setParentActive(
        params.data.entityId,
        body.data.isActive,
      );
      if (!updated) {
        return response.status(404).json({ message: "Parent was not found." });
      }
      return response.status(200).json({ isActive: body.data.isActive });
    } catch (error: unknown) {
      console.error("Admin parent status update failed:", error);
      return response.status(500).json({
        message: "Unable to update this parent right now.",
      });
    }
  };

  deleteParent = async (request: Request, response: Response) => {
    const params = adminEntityIdSchema.safeParse({
      entityId: request.params.parentId,
    });
    if (!params.success) {
      return response.status(400).json({ message: "The parent ID is invalid." });
    }

    try {
      const deleted = await this.parentRegistrations.deleteParent(
        params.data.entityId,
      );
      if (!deleted) {
        return response.status(404).json({ message: "Parent was not found." });
      }
      return response.status(204).send();
    } catch (error: unknown) {
      console.error("Admin parent deletion failed:", error);
      return response.status(500).json({
        message: "Unable to remove this parent right now.",
      });
    }
  };
}
