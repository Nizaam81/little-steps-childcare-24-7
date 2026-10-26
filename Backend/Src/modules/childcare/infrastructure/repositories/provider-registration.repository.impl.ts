import type {
  ProviderRegistrationDocument,
  ProviderRegistrationRepository,
  ProviderRegistrationReview,
  ProviderRegistrationStatus,
} from "../../domain/repositories/provider-registration.repository.js";
import { ProviderRegistrationModel } from "../persistence/provider-registration.model.js";

export class ProviderRegistrationRepositoryImpl
  implements ProviderRegistrationRepository
{
  async create(data: Parameters<ProviderRegistrationRepository["create"]>[0]) {
    const registration = await ProviderRegistrationModel.create({
      ...data.application,
      tradeLicense: data.tradeLicense,
      supportingDocuments: data.supportingDocuments,
      status: "pending_verification",
    });

    return { id: registration.id };
  }

  async listForReview(
    status?: ProviderRegistrationStatus,
  ): Promise<ProviderRegistrationReview[]> {
    const applications = await ProviderRegistrationModel.find(
      status ? { status } : {},
    )
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return applications.map((application) => {
      const {
        _id,
        ownerName,
        ownerEmail,
        ownerPhone,
        centreName,
        address,
        district,
        centreEmail,
        centrePhone,
        ageGroups,
        careTypes,
        capacity,
        openingTime,
        closingTime,
        dailyPrice,
        monthlyPrice,
        status: applicationStatus,
        reviewNotes,
        createdAt,
        updatedAt,
        tradeLicense,
        supportingDocuments,
      } = application;

      return {
        applicationId: _id.toString(),
        ownerName,
        ownerEmail,
        ownerPhone,
        centreName,
        address,
        district,
        centreEmail,
        centrePhone,
        ageGroups,
        careTypes,
        capacity,
        openingTime,
        closingTime,
        dailyPrice,
        monthlyPrice,
        status: applicationStatus as ProviderRegistrationStatus,
        reviewNotes,
        createdAt,
        updatedAt,
        tradeLicense: this.withoutPath(tradeLicense),
        supportingDocuments: supportingDocuments.map((document) =>
          this.withoutPath(document),
        ),
      };
    });
  }

  async updateReview(data: {
    applicationId: string;
    status: Exclude<ProviderRegistrationStatus, "pending_verification">;
    reviewNotes: string;
    adminId: string;
  }): Promise<{ id: string; status: ProviderRegistrationStatus } | null> {
    const application = await ProviderRegistrationModel.findOneAndUpdate(
      {
        _id: data.applicationId,
        status: { $in: ["pending_verification", "corrections_requested"] },
      },
      {
        $set: {
          status: data.status,
          reviewNotes: data.reviewNotes,
          reviewedBy: data.adminId,
          reviewedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    ).select("_id status");

    return application
      ? {
          id: application.id,
          status: application.status as ProviderRegistrationStatus,
        }
      : null;
  }

  async findDocument(
    applicationId: string,
    storedName: string,
  ): Promise<ProviderRegistrationDocument | null> {
    const application = await ProviderRegistrationModel.findById(
      applicationId,
    ).select("tradeLicense supportingDocuments");
    if (!application) {
      return null;
    }

    const documents = [
      application.tradeLicense,
      ...application.supportingDocuments,
    ];
    const document = documents.find((candidate) => candidate.storedName === storedName);
    if (!document) {
      return null;
    }

    return {
      storedName: document.storedName,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      path: document.path,
    };
  }

  private withoutPath(
    document: ProviderRegistrationDocument,
  ): Omit<ProviderRegistrationDocument, "path"> {
    return {
      storedName: document.storedName,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
    };
  }
}
