import { ParentRegistrationModel } from "../persistence/parent.Modals.js";

import type { ParentRegistrationRepository } from "../../domain/repositories/parent-registration.repository.js";

export class ParentRegistrationRepositoryImpl
  implements ParentRegistrationRepository
{
  async emailExists(email: string): Promise<boolean> {
    const registration = await ParentRegistrationModel.exists({
      email: email.trim().toLowerCase(),
      $or: [
        { emailVerified: true },
        { expiresAt: { $gt: new Date() } },
      ],
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

  async findPendingRegistrationByEmail(
    email: string,
  ): Promise<{ id: string; email: string } | null> {
    const registration = await ParentRegistrationModel.findOne({
      email: email.trim().toLowerCase(),
      emailVerified: false,
      expiresAt: { $gt: new Date() },
    }).select("_id email");

    if (!registration) {
      return null;
    }

    return {
      id: registration.id,
      email: registration.email,
    };
  }

  async completeRegistration(data: {
    registrationId: string;
    passwordHash: string;
  }): Promise<{ id: string } | null> {
    const registration = await ParentRegistrationModel.findOneAndUpdate(
      {
        _id: data.registrationId,
        emailVerified: false,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          emailVerified: true,
          passwordHash: data.passwordHash,
        },
        $unset: {
          expiresAt: "",
        },
      },
      { returnDocument: "after" },
    ).select("_id");

    return registration ? { id: registration.id } : null;
  }
}