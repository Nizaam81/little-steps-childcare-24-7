import apiClient from "../../config/axios";
import type { ParentProfile } from "./dashboardTypes";

export type CentreRecord = {
  id: string;
  name: string;
  address: string;
  district: string;
  ageGroups: string[];
  careTypes: string[];
  capacity: number;
  openingTime: string;
  closingTime: string;
  dailyPrice: number;
  monthlyPrice: number;
  hourlyPrice: number;
  description: string;
  availabilitySlots: { startTime: string; endTime: string }[];
  availableDays: string[];
  photos: { id: string; url: string }[];
  rating: number;
  reviews: number;
  verified: boolean;
};

export type RecommendedCaregiver = {
  id: string;
  name: string;
  role: string;
  experience: string;
  centreId: string;
  centreName: string;
  district: string;
  rating: number;
  reviews: number;
};

export type ParentNotification = {
  id: string;
  title: string;
  message: string;
  type: "booking" | "account" | "camera_access" | "general";
  read: boolean;
  createdAt: string;
};

export type WishlistEntry = {
  targetType: "daycare" | "caregiver";
  targetId: string;
};

export async function fetchParentProfile() {
  const response = await apiClient.get<{ profile: ParentProfile & { id: string } }>("/profile");
  return response.data.profile;
}

export async function updateParentProfile(profile: ParentProfile) {
  const response = await apiClient.patch<{ profile: ParentProfile & { id: string } }>(
    "/profile",
    { fullName: profile.fullName, phoneNumber: profile.phoneNumber },
  );
  return response.data.profile;
}

export async function fetchCentres(search = "") {
  const response = await apiClient.get<{ centres: CentreRecord[] }>("/centres", {
    params: search ? { search } : undefined,
  });
  return response.data.centres;
}

export async function fetchRecommendedCaregivers() {
  const response = await apiClient.get<{ caregivers: RecommendedCaregiver[] }>("/caregivers/recommended");
  return response.data.caregivers;
}

export async function fetchWishlist() {
  const response = await apiClient.get<{ wishlist: WishlistEntry[] }>("/wishlist");
  return response.data.wishlist;
}

export async function saveWishlistItem(entry: WishlistEntry) {
  await apiClient.post("/wishlist", entry);
}

export async function removeWishlistItem(entry: WishlistEntry) {
  await apiClient.delete(`/wishlist/${entry.targetType}/${entry.targetId}`);
}

export async function submitFeedback(input: {
  targetType: WishlistEntry["targetType"];
  targetId: string;
  rating: number;
  comment: string;
}) {
  await apiClient.post("/feedback", input);
}

export async function fetchNotifications() {
  const response = await apiClient.get<{ notifications: ParentNotification[] }>("/notifications");
  return response.data.notifications;
}

export async function markNotificationsRead(id = "all") {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function fetchParentBookings() {
  const response = await apiClient.get<{ bookings: Array<{
    id: string;
    centreId: string;
    centreName: string;
    location: string;
    childName: string;
    carePlan: string;
    requestedDate: string;
    bookingStartDate?: string;
    bookingEndDate?: string;
    cameraAccessStatus?: "not_requested" | "pending" | "approved" | "rejected";
    status: "pending" | "accepted" | "rejected";
  }> }>("/bookings");
  return response.data.bookings;
}

export async function createParentBooking(input: {
  centreId: string;
  childName: string;
  carePlan: string;
  requestedDate: string;
  bookingStartDate: string;
  bookingEndDate: string;
}) {
  const response = await apiClient.post("/bookings", input);
  return response.data;
}

export async function requestParentCameraAccess(bookingId: string) {
  const response = await apiClient.post<{ requested: boolean; status: "pending" }>(
    `/bookings/${bookingId}/camera-access`,
  );
  return response.data;
}
