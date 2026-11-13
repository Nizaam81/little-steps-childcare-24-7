export interface ProviderIdentity {
  id: string;
  ownerName: string;
  ownerEmail: string;
  centreName: string;
}

export interface ProviderCentreProfile {
  name: string;
  address: string;
  district: string;
  openingTime: string;
  closingTime: string;
  capacity: number;
  hourlyPrice: number;
  dailyPrice: number;
  monthlyPrice: number;
  ageGroups: string[];
  careTypes: string[];
  availabilitySlots: { id: string; startTime: string; endTime: string }[];
  description: string;
  isAcceptingBookings: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  role: string;
  experience: string;
}

export interface BookingRequest {
  id: string;
  parentBookingId?: string;
  parentName: string;
  childName: string;
  carePlan: string;
  requestedDate: string;
  status: "Pending" | "Accepted" | "Declined";
}

export interface ProviderWorkspaceData {
  profile: ProviderCentreProfile;
  caregivers: Caregiver[];
  bookings: BookingRequest[];
  availableDays: string[];
}

export const providerIdentityStorageKey = "providerIdentity";
const parentCentreStorageKey = "providerCentrePublicPreview";

const workspaceStorageKey = (providerId: string) =>
  `providerWorkspace:${providerId}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isProviderCentreProfile(value: unknown): value is ProviderCentreProfile {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.address === "string" &&
    typeof value.district === "string" &&
    typeof value.openingTime === "string" &&
    typeof value.closingTime === "string" &&
    typeof value.capacity === "number" &&
    typeof value.hourlyPrice === "number" &&
    typeof value.dailyPrice === "number" &&
    typeof value.monthlyPrice === "number" &&
    isStringArray(value.ageGroups) &&
    isStringArray(value.careTypes) &&
    Array.isArray(value.availabilitySlots) &&
    value.availabilitySlots.every(
      (slot) =>
        isRecord(slot) &&
        typeof slot.id === "string" &&
        typeof slot.startTime === "string" &&
        typeof slot.endTime === "string",
    ) &&
    typeof value.description === "string" &&
    typeof value.isAcceptingBookings === "boolean"
  );
}

function isProviderWorkspaceData(value: unknown): value is ProviderWorkspaceData {
  return (
    isRecord(value) &&
    isProviderCentreProfile(value.profile) &&
    Array.isArray(value.caregivers) &&
    value.caregivers.every(
      (caregiver) =>
        isRecord(caregiver) &&
        typeof caregiver.id === "string" &&
        typeof caregiver.name === "string" &&
        typeof caregiver.role === "string" &&
        typeof caregiver.experience === "string",
    ) &&
    Array.isArray(value.bookings) &&
    value.bookings.every(
      (booking) =>
        isRecord(booking) &&
        typeof booking.id === "string" &&
        (booking.parentBookingId === undefined ||
          typeof booking.parentBookingId === "string") &&
        typeof booking.parentName === "string" &&
        typeof booking.childName === "string" &&
        typeof booking.carePlan === "string" &&
        typeof booking.requestedDate === "string" &&
        (booking.status === "Pending" ||
          booking.status === "Accepted" ||
          booking.status === "Declined"),
    ) &&
    isStringArray(value.availableDays)
  );
}

export function readProviderIdentity(): ProviderIdentity | null {
  const raw = localStorage.getItem(providerIdentityStorageKey);
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Saved provider account details are invalid. Please sign in again.");
  }
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.ownerName !== "string" ||
    typeof value.ownerEmail !== "string" ||
    typeof value.centreName !== "string"
  ) {
    throw new Error("Saved provider account details are invalid. Please sign in again.");
  }

  return {
    id: value.id,
    ownerName: value.ownerName,
    ownerEmail: value.ownerEmail,
    centreName: value.centreName,
  };
}

export function readProviderWorkspace(
  providerId: string,
): ProviderWorkspaceData | null {
  const raw = localStorage.getItem(workspaceStorageKey(providerId));
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Saved daycare workspace data is invalid.");
  }
  if (!isProviderWorkspaceData(value)) {
    throw new Error("Saved daycare workspace data is invalid.");
  }

  return value;
}

export function saveProviderWorkspace(
  providerId: string,
  workspace: ProviderWorkspaceData,
) {
  localStorage.setItem(workspaceStorageKey(providerId), JSON.stringify(workspace));
  const { profile } = workspace;
  const shouldListCentre =
    profile.isAcceptingBookings &&
    profile.name.trim() !== "" &&
    profile.address.trim() !== "" &&
    profile.district.trim() !== "" &&
    profile.monthlyPrice > 0;
  const savedPreview = localStorage.getItem(parentCentreStorageKey);
  if (shouldListCentre) {
    localStorage.setItem(
      parentCentreStorageKey,
      JSON.stringify({ providerId, profile }),
    );
  } else if (savedPreview) {
    const preview: unknown = JSON.parse(savedPreview);
    if (isRecord(preview) && preview.providerId === providerId) {
      localStorage.removeItem(parentCentreStorageKey);
    }
  }
}

export function readParentVisibleCentre(): ProviderCentreProfile | null {
  const previewRaw = localStorage.getItem(parentCentreStorageKey);
  if (!previewRaw) return null;

  let preview: unknown;
  try {
    preview = JSON.parse(previewRaw);
  } catch {
    throw new Error("Saved daycare listing data is invalid.");
  }
  if (
    !isRecord(preview) ||
    typeof preview.providerId !== "string" ||
    !isProviderCentreProfile(preview.profile)
  ) {
    throw new Error("Saved daycare listing data is invalid.");
  }
  return preview.profile;
}

export function readParentProviderWorkspace(): {
  providerId: string;
  workspace: ProviderWorkspaceData | null;
} | null {
  const previewRaw = localStorage.getItem(parentCentreStorageKey);
  if (!previewRaw) return null;

  let preview: unknown;
  try {
    preview = JSON.parse(previewRaw);
  } catch {
    throw new Error("Saved daycare listing data is invalid.");
  }
  if (!isRecord(preview) || typeof preview.providerId !== "string") {
    throw new Error("Saved daycare listing data is invalid.");
  }
  return {
    providerId: preview.providerId,
    workspace: readProviderWorkspace(preview.providerId),
  };
}
