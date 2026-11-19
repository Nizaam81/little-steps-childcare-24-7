import axios from "axios";
import { installAuthInterceptors } from "../auth/authSession";

export type ProviderApplicationStatus =
  | "pending_verification"
  | "approved"
  | "rejected"
  | "corrections_requested";

export interface ProviderApplicationDocument {
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ProviderApplication {
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
  status: ProviderApplicationStatus;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
  tradeLicense: ProviderApplicationDocument;
  supportingDocuments: ProviderApplicationDocument[];
}

export interface ApprovedCentre {
  applicationId: string;
  centreName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  district: string;
  centrePhone: string;
  capacity: number;
  isActive: boolean;
  approvedAt: string;
}

export interface AdminParent {
  parentId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
}

export type ProviderReviewDecision = Exclude<
  ProviderApplicationStatus,
  "pending_verification"
>;

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const adminApi = axios.create({
  baseURL: `${apiBaseUrl}/api/admin`,
  headers: { "Content-Type": "application/json" },
});

installAuthInterceptors(adminApi, {
  access: "adminToken",
  refresh: "adminRefreshToken",
});

export const fetchProviderApplications = async () => {
  const response = await adminApi.get<{
    applications: ProviderApplication[];
  }>("/providers");
  return response.data.applications;
};

export const fetchProviderDocument = async (
  applicationId: string,
  publicId: string,
) => {
  const response = await adminApi.get<Blob>(
    `/providers/${applicationId}/documents`,
    {
      params: { publicId },
      responseType: "blob",
    },
  );
  return response.data;
};

export const reviewProviderApplication = async (
  applicationId: string,
  status: ProviderReviewDecision,
  reviewNotes: string,
) => {
  await adminApi.patch(`/providers/${applicationId}/review`, {
    status,
    reviewNotes,
  });
};

export const fetchApprovedCentres = async () => {
  const response = await adminApi.get<{ centres: ApprovedCentre[] }>(
    "/centres",
  );
  return response.data.centres;
};

export const setCentreActive = async (
  applicationId: string,
  isActive: boolean,
) => {
  await adminApi.patch(`/centres/${applicationId}/status`, { isActive });
};

export const deleteCentre = async (applicationId: string) => {
  await adminApi.delete(`/centres/${applicationId}`);
};

export const fetchParents = async () => {
  const response = await adminApi.get<{ parents: AdminParent[] }>("/parents");
  return response.data.parents;
};

export const setParentActive = async (
  parentId: string,
  isActive: boolean,
) => {
  await adminApi.patch(`/parents/${parentId}/status`, { isActive });
};

export const deleteParent = async (parentId: string) => {
  await adminApi.delete(`/parents/${parentId}`);
};
