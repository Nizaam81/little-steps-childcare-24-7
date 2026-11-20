import { providerApi } from "../auth/providerLoginApi";
import type {
  BookingRequest,
  Caregiver,
  DaycarePhoto,
  ProviderCentreProfile,
  ProviderWorkspaceData,
} from "./providerWorkspace";

type ServerWorkspace = {
  centreStatus: ProviderWorkspaceData["centreStatus"];
  availableDays: string[];
  photos: DaycarePhoto[];
  profile: Omit<ProviderCentreProfile, "availabilitySlots"> & {
    availabilitySlots: Array<{ startTime: string; endTime: string }>;
  };
  caregivers: Caregiver[];
  bookings: Array<Omit<BookingRequest, "status" | "requestedDate"> & {
    requestedDate: string;
    status: "pending" | "accepted" | "rejected";
  }>;
};

function mapWorkspace(server: ServerWorkspace): ProviderWorkspaceData {
  return {
    centreStatus: server.centreStatus,
    profile: {
      ...server.profile,
      availabilitySlots: server.profile.availabilitySlots.map((slot, index) => ({
        id: `slot-${index}`,
        ...slot,
      })),
    },
    caregivers: server.caregivers,
    bookings: server.bookings.map((booking) => ({
      ...booking,
      requestedDate: new Date(booking.requestedDate).toLocaleDateString(),
      status: booking.status === "accepted"
        ? "Accepted"
        : booking.status === "rejected"
          ? "Declined"
          : "Pending",
    })),
    availableDays: server.availableDays,
    photos: server.photos ?? [],
  };
}

export async function fetchProviderWorkspace(): Promise<ProviderWorkspaceData> {
  const response = await providerApi.get<{ workspace: ServerWorkspace }>("/workspace");
  return mapWorkspace(response.data.workspace);
}

export async function saveProviderProfile(
  profile: ProviderCentreProfile,
  availableDays: string[],
): Promise<void> {
  await providerApi.patch("/workspace/profile", {
    ...profile,
    availableDays,
    availabilitySlots: profile.availabilitySlots.map(({ startTime, endTime }) => ({
      startTime,
      endTime,
    })),
  });
}

export async function addProviderCaregiver(input: Omit<Caregiver, "id">) {
  const response = await providerApi.post<{ caregiver: Caregiver }>("/workspace/caregivers", input);
  return response.data.caregiver;
}

export async function removeProviderCaregiver(id: string) {
  await providerApi.delete(`/workspace/caregivers/${id}`);
}

export async function uploadDaycarePhoto(file: File): Promise<DaycarePhoto> {
  const formData = new FormData();
  formData.append("photo", file);
  const response = await providerApi.post<{ photo: DaycarePhoto }>(
    "/workspace/photos",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data.photo;
}

export async function deleteDaycarePhoto(photoId: string): Promise<void> {
  await providerApi.delete(`/workspace/photos/${photoId}`);
}

export async function decideProviderBooking(
  id: string,
  status: "Accepted" | "Declined",
) {
  await providerApi.patch(`/workspace/bookings/${id}`, {
    status: status === "Accepted" ? "accepted" : "rejected",
  });
}

export async function deleteRejectedProviderBooking(id: string): Promise<void> {
  await providerApi.delete(`/workspace/bookings/${id}`);
}

export async function decideProviderCameraAccess(
  id: string,
  status: "approved" | "rejected",
) {
  await providerApi.patch(`/workspace/bookings/${id}/camera-access`, { status });
}
