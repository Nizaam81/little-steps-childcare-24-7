import type { Request, Response } from "express";
import type { RegisterParentDetailsUseCase } from "../../application/use-cases/register-parent-details.usecase.js";
import { parentDetailsSchema } from "../validators/parent-signup.validation.js";

export class ParentController {
  constructor(
    private readonly registerDetails: RegisterParentDetailsUseCase,
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const parsed = parentDetailsSchema.safeParse(req.body);
      console.log(parsed)

      if (!parsed.success) {
        return res.status(400).json({
          message: "Please provide valid registration details.",
          errors: parsed.error.issues,
        });
      }

      const result = await this.registerDetails.execute(parsed.data);
      return res.status(201).json(result);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "EMAIL_ALREADY_REGISTERED"
      ) {
        return res.status(409).json({
          message: "This email is already registered.",
        });
      }

      console.error("Parent registration failed:", error);
      return res.status(500).json({
        message: "Unable to start registration right now.",
      });
    }
  };
}