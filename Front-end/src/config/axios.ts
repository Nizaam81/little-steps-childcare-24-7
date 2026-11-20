import axios from "axios";
import { installAuthInterceptors } from "../features/auth/authSession";

const apiClient = axios.create({
  baseURL: `${(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/parent`,
  headers: {
    "Content-Type": "application/json",
  },
});

installAuthInterceptors(apiClient, {
  access: "parentToken",
  refresh: "parentRefreshToken",
});

export default apiClient;
