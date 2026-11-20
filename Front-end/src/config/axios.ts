import axios from "axios";
import { installAuthInterceptors } from "../features/auth/authSession";

const apiClient = axios.create({
  baseURL: `${(import.meta.env.VITE_API_BASE_URL ?? "https://little-steps-api.duckdns.org").replace(/\/$/, "")}/api/parent`,
  headers: {
    "Content-Type": "application/json",
  },
});

installAuthInterceptors(apiClient, {
  access: "parentToken",
  refresh: "parentRefreshToken",
});

export default apiClient;
