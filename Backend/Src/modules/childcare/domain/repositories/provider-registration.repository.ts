export interface ProviderRegistrationDocument {
  storedName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface ProviderRegistrationData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  passwordHash: string;
  centreName: string;
  address: string;
  district: string;
  centreEmail: string;
  centrePhone: string;
  ageGroups: string[];
  careTypes: string[];
  capacity: number;
  openingTime: string;
  closingTime: string;
  dailyPrice: number | "";
  monthlyPrice: number | "";
}

export type ProviderRegistrationStatus =
  | "pending_verification"
  | "approved"
  | "rejected"
  | "corrections_requested";

export interface ProviderRegistrationReview {
  applicationId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  centreName: string;
  address: string;
  district: string;
  centreEmail: string;
  centrePhone: string;
  ageGroups: string[];
  careTypes: string[];
  capacity: number;
  openingTime: string;
  closingTime: string;
  dailyPrice: number | "";
  monthlyPrice: number | "";
  status: ProviderRegistrationStatus;
  reviewNotes: string;
  createdAt: Date;
  updatedAt: Date;
  tradeLicense: Omit<ProviderRegistrationDocument, "path">;
  supportingDocuments: Array<Omit<ProviderRegistrationDocument, "path">>;
}

export interface ProviderRegistrationRepository {
  create(data: {
    application: ProviderRegistrationData;
    tradeLicense: ProviderRegistrationDocument;
    supportingDocuments: ProviderRegistrationDocument[];
  }): Promise<{ id: string }>;
  listForReview(
    status?: ProviderRegistrationStatus,
  ): Promise<ProviderRegistrationReview[]>;
  updateReview(data: {
    applicationId: string;
    status: Exclude<ProviderRegistrationStatus, "pending_verification">;
    reviewNotes: string;
    adminId: string;
  }): Promise<{ id: string; status: ProviderRegistrationStatus } | null>;
  findDocument(
    applicationId: string,
    storedName: string,
  ): Promise<ProviderRegistrationDocument | null>;
}
