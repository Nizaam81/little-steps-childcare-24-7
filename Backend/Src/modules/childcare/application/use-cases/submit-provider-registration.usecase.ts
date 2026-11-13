import { readFile, unlink } from "node:fs/promises";
import type { UploadApiResponse } from "cloudinary";
import type {
  ProviderRegistrationData,
  ProviderRegistrationDocument,
  ProviderRegistrationRepository,
} from "../../domain/repositories/provider-registration.repository.js";
import type { ProviderEmailVerificationStore } from "../services/provider-email-verification.store.js";
import { hashPassword } from "../../../../shared/utils/password.js";
import {
  deleteProviderDocument,
  uploadProviderDocument,
} from "../../infrastructure/services/cloudinary-provider-document-storage.js";

const isValidDocumentContent = async (
  document: Express.Multer.File,
): Promise<boolean> => {
  const header = await readFile(document.path);

  if (document.mimetype === "application/pdf") {
    return header.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (document.mimetype === "image/png") {
    return header.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  if (document.mimetype === "image/jpeg") {
    return (
      header.length >= 3 &&
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff
    );
  }

  return false;
};

const toDocument = (
  document: Express.Multer.File,
  upload: UploadApiResponse,
): ProviderRegistrationDocument => ({
  url: upload.secure_url,
  publicId: upload.public_id,
  originalName: document.originalname,
  mimeType: document.mimetype,
  size: document.size,
});

export class SubmitProviderRegistrationUseCase {
  constructor(
    private readonly registrations: ProviderRegistrationRepository,
    private readonly verificationStore: ProviderEmailVerificationStore,
  ) {}

  async execute(input: {
    application: Omit<ProviderRegistrationData, "passwordHash"> & {
      password: string;
    };
    tradeLicense: Express.Multer.File;
    supportingDocuments: Express.Multer.File[];
  }): Promise<{ applicationId: string; status: "pending_verification" }> {
    const email = input.application.ownerEmail.trim().toLowerCase();
    if (!this.verificationStore.isVerified(email)) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const documents = [input.tradeLicense, ...input.supportingDocuments];
    for (const document of documents) {
      if (!(await isValidDocumentContent(document))) {
        throw new Error("INVALID_DOCUMENT_CONTENT");
      }
    }

    const uploaded: UploadApiResponse[] = [];
    let registration: { id: string };
    try {
      const uploadedDocuments: ProviderRegistrationDocument[] = [];
      for (const document of documents) {
        const upload = await uploadProviderDocument(document.path);
        uploaded.push(upload);
        uploadedDocuments.push(toDocument(document, upload));
        try {
          await unlink(document.path);
        } catch (error: unknown) {
          throw new Error("PROVIDER_DOCUMENT_TEMP_CLEANUP_FAILED", {
            cause: error,
          });
        }
      }

      const { password, ...application } = input.application;
      const tradeLicense = uploadedDocuments[0];
      if (!tradeLicense) {
        throw new Error("TRADE_LICENSE_UPLOAD_MISSING");
      }
      registration = await this.registrations.create({
        application: {
          ...application,
          ownerEmail: email,
          passwordHash: await hashPassword(password),
        },
        tradeLicense,
        supportingDocuments: uploadedDocuments.slice(1),
      });
    } catch (error: unknown) {
      const cleanupResults = await Promise.allSettled(
        uploaded.map((document) =>
          deleteProviderDocument(document.public_id, document.resource_type),
        ),
      );
      for (const result of cleanupResults) {
        if (result.status === "rejected") {
          console.error(
            "Unable to remove a provider document from Cloudinary after a failed registration:",
            result.reason,
          );
        }
      }
      throw error;
    }

    this.verificationStore.consumeVerified(email);

    return {
      applicationId: registration.id,
      status: "pending_verification",
    };
  }
}
