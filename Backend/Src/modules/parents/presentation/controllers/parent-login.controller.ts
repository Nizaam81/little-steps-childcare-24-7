import type { Request, Response } from "express";
import type { LoginParentUseCase } from "../../application/use-cases/login-parent.usecase.js";
import type { AuthTokenService } from "../../../../shared/services/auth-token.service.js";
import { parentLoginSchema } from "../validators/parent-signup.validation.js";

export class ParentLoginController {
  constructor(
    private readonly loginParent: LoginParentUseCase,
    private readonly sessionTokens: AuthTokenService,
  ) {}

  login = async (req: Request, res: Response) => {
    const parsed = parentLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Provide a valid email address and password.",
        errors: parsed.error.issues,
      });
    }

    try {
      const result = await this.loginParent.execute(parsed.data);
      const session = await this.sessionTokens.issueSession({
        subject: result.parent.id,
        email: result.parent.email,
        role: "parent",
        accessExpiresInSeconds: result.expiresInSeconds,
      });

      return res.status(200).json({
        message: "Welcome back to Little Steps!",
        parent: result.parent,
        ...session,
        token: session.accessToken,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          message: "Invalid email or password.",
        });
      }

      console.error("Parent login failed:", error);
      return res.status(500).json({
        message: "Unable to sign in right now.",
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Authentication is required." });
    }
    try {
      await this.sessionTokens.revokeSession(req.auth);
      return res.status(200).json({ message: "Logged out successfully." });
    } catch (error: unknown) {
      console.error("Parent logout failed:", error);
      return res.status(500).json({ message: "Unable to log out right now." });
    }
  };
}
