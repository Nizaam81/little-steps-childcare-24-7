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
        tradeLicense: this.documentMetadata(tradeLicense),
        supportingDocuments: supportingDocuments.map((document) =>
          this.documentMetadata(document),
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
    publicId: string,
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
    const document = documents.find(
      (candidate) => candidate.publicId === publicId,
    );
    if (!document) {
      return null;
    }

    return {
      url: document.url,
      publicId: document.publicId,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
    };
  }

  async findForLogin(email: string) {
    const application = await ProviderRegistrationModel.findOne({
      ownerEmail: email,
      isActive: { $ne: false },
    }).select("+passwordHash ownerName ownerEmail centreName status reviewNotes isActive");

    if (!application) {
      return null;
    }

    return {
      id: application.id,
      ownerName: application.ownerName,
      ownerEmail: application.ownerEmail,
      centreName: application.centreName,
      passwordHash: application.passwordHash,
      status: application.status as ProviderRegistrationStatus,
      reviewNotes: application.reviewNotes,
      isActive: application.isActive,
    };
  }

  async listApprovedCentres() {
    const centres = await ProviderRegistrationModel.find({ status: "approved" })
      .select(
        "_id centreName ownerName ownerEmail ownerPhone address district centrePhone capacity isActive reviewedAt updatedAt",
      )
      .sort({ reviewedAt: -1, updatedAt: -1 });

    return centres.map((centre) => ({
      applicationId: centre.id,
      centreName: centre.centreName,
      ownerName: centre.ownerName,
      ownerEmail: centre.ownerEmail,
      ownerPhone: centre.ownerPhone,
      address: centre.address,
      district: centre.district,
      centrePhone: centre.centrePhone,
      capacity: centre.capacity,
      isActive: centre.isActive,
      approvedAt: centre.reviewedAt ?? centre.updatedAt,
    }));
  }

  async setCentreActive(applicationId: string, isActive: boolean) {
    const result = await ProviderRegistrationModel.updateOne(
      { _id: applicationId, status: "approved" },
      { $set: { isActive } },
    );
    return result.matchedCount > 0;
  }

  async deleteApprovedCentre(applicationId: string) {
    const result = await ProviderRegistrationModel.deleteOne({
      _id: applicationId,
      status: "approved",
    });
    return result.deletedCount > 0;
  }

  private documentMetadata(
    document: ProviderRegistrationDocument,
  ): ProviderRegistrationDocument {
    return {
      url: document.url,
      publicId: document.publicId,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
    };
  }
}
