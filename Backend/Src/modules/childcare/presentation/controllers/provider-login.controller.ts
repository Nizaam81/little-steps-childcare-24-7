import type { Request, Response } from "express";
import type { ProviderSessionTokenService } from "../../application/services/provider-session-token.service.js";
import type { LoginProviderUseCase } from "../../application/use-cases/login-provider.usecase.js";
import { providerLoginSchema } from "../Validators/provider-login.validation.js";

const providerSessionDurationSeconds = 12 * 60 * 60;

export class ProviderLoginController {
  constructor(
    private readonly loginProvider: LoginProviderUseCase,
    private readonly sessionTokens: ProviderSessionTokenService,
  ) {}

  login = async (request: Request, response: Response) => {
    const parsed = providerLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Provide a valid email address and password.",
        errors: parsed.error.issues,
      });
    }

    try {
      const result = await this.loginProvider.execute(parsed.data);
      const token = result.dashboardAccess
        ? this.sessionTokens.issue({
            providerId: result.provider.id,
            email: result.provider.ownerEmail,
            expiresInSeconds: providerSessionDurationSeconds,
          })
        : null;

      return response.status(200).json({
        message: result.dashboardAccess
          ? "Login successful."
          : "Application status retrieved. Dashboard access is not available yet.",
        provider: result.provider,
        dashboardAccess: result.dashboardAccess,
        token,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "INVALID_PROVIDER_CREDENTIALS"
      ) {
        return response.status(401).json({
          message: "Invalid email or password.",
        });
      }

      console.error("Provider login failed:", error);
      return response.status(500).json({
        message: "Unable to sign in right now.",
      });
    }
  };

  logout = (_request: Request, response: Response) => {
    return response.status(200).json({
      message: "Logged out successfully. Remove the access token from the client.",
    });
  };
}
