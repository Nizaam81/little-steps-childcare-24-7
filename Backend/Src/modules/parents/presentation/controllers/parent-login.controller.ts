import type { Request, Response } from "express";
import type { LoginParentUseCase } from "../../application/use-cases/login-parent.usecase.js";
import type { ParentSessionTokenService } from "../../application/services/parent-session-token.service.js";
import { parentLoginSchema } from "../validators/parent-signup.validation.js";

export class ParentLoginController {
  constructor(
    private readonly loginParent: LoginParentUseCase,
    private readonly sessionTokens: ParentSessionTokenService,
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
      const token = this.sessionTokens.issue({
        parentId: result.parent.id,
        email: result.parent.email,
        expiresInSeconds: result.expiresInSeconds,
      });

      return res.status(200).json({
        message: "Welcome back to Little Steps!",
        parent: result.parent,
        token,
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
}
