import type { Request, Response } from "express";
import type { RegisterParentDetailsUseCase } from "../../application/use-cases/register-parent-details.usecase.js";

export class ParentController {
  constructor(
    private readonly registerDetails: RegisterParentDetailsUseCase,
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const { fullName, email, phoneNumber } = req.body;

      const result = await this.registerDetails.execute({
        fullName,
        email,
        phoneNumber,
      });

      return res.status(201).json(result);
    } catch {
      return res.status(500).json({
        message: "Something went wrong",
      });
    }
  };
}