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

  async findVerifiedByEmail(email: string): Promise<{
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
  } | null> {
    const registration = await ParentRegistrationModel.findOne({
      email: email.trim().toLowerCase(),
      emailVerified: true,
      isActive: { $ne: false },
    }).select("+passwordHash _id fullName email");

    if (!registration?.passwordHash) {
      return null;
    }

    return {
      id: registration.id,
      fullName: registration.fullName,
      email: registration.email,
      passwordHash: registration.passwordHash,
    };
  }

  async listVerifiedParents() {
    const parents = await ParentRegistrationModel.find({
      emailVerified: true,
    })
      .select("_id fullName email phoneNumber isActive createdAt")
      .sort({ createdAt: -1 });

    return parents.map((parent) => ({
      parentId: parent.id,
      fullName: parent.fullName,
      email: parent.email,
      phoneNumber: parent.phoneNumber,
      isActive: parent.isActive,
      createdAt: parent.createdAt,
    }));
  }

  async setParentActive(parentId: string, isActive: boolean) {
    const result = await ParentRegistrationModel.updateOne(
      { _id: parentId, emailVerified: true },
      { $set: { isActive } },
    );
    return result.matchedCount > 0;
  }

  async deleteParent(parentId: string) {
    const result = await ParentRegistrationModel.deleteOne({
      _id: parentId,
      emailVerified: true,
    });
    return result.deletedCount > 0;
  }
}