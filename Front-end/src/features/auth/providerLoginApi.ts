import axios from "axios";
import { installAuthInterceptors } from "./authSession";

export type ProviderLoginStatus =
  | "pending_verification"
  | "approved"
  | "rejected"
  | "corrections_requested";

export interface ProviderLoginResponse {
  message: string;
  provider: {
    id: string;
    ownerName: string;
    ownerEmail: string;
    centreName: string;
    status: ProviderLoginStatus;
    reviewNotes: string;
  };
  dashboardAccess: boolean;
  token: string | null;
  refreshToken?: string | null;
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const providerApi = axios.create({
  baseURL: `${apiBaseUrl}/api/childcare`,
  headers: { "Content-Type": "application/json" },
});
installAuthInterceptors(providerApi, {
  access: "providerToken",
  refresh: "providerRefreshToken",
});

export async function loginProvider(email: string, password: string) {
  const response = await providerApi.post<ProviderLoginResponse>("/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return response.data;
}
