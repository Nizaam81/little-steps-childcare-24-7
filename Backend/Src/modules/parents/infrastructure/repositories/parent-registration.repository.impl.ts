import { ParentRegistrationModel } from "../persistence/parent.Modals.js";

import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";

export class ParentRegistrationRepositoryImpl
  implements ParentRegistrationRepository
{
  async emailExists(email: string): Promise<boolean> {
    const registration = await ParentRegistrationModel.exists({
      email: email.trim().toLowerCase(),
    });

    return registration !== null;
  }

  async createPendingRegistration(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }): Promise<{ id: string }> {
    const registration = await ParentRegistrationModel.create({
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phoneNumber: data.phoneNumber.trim(),
      emailVerified: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    return {
      id: registration.id,
    };
  }
}