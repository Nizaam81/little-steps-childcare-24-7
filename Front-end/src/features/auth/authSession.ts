import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

type SessionKeys = {
  access: string;
  refresh: string;
};

export type AuthRole = "parent" | "provider" | "admin";

type RetriableConfig = InternalAxiosRequestConfig & { retriedAfterRefresh?: boolean };

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
const pendingRefreshes = new Map<string, Promise<string>>();
const sessionClients = new Map<string, AxiosInstance>();

export function installAuthInterceptors(
  client: AxiosInstance,
  keys: SessionKeys,
): void {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(keys.access);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error);
      }

      const request = error.config as RetriableConfig | undefined;
      const refreshToken = localStorage.getItem(keys.refresh);
      if (!request || request.retriedAfterRefresh || !refreshToken) {
        return Promise.reject(error);
      }
      request.retriedAfterRefresh = true;

      let refresh = pendingRefreshes.get(keys.refresh);
      if (!refresh) {
        refresh = axios
          .post<{ accessToken: string; refreshToken: string }>(
            `${apiBaseUrl}/api/auth/refresh`,
            { refreshToken },
          )
          .then(({ data }) => {
            if (!data.accessToken || !data.refreshToken) {
              throw new Error("The refresh response did not contain a complete session.");
            }
            localStorage.setItem(keys.access, data.accessToken);
            localStorage.setItem(keys.refresh, data.refreshToken);
            return data.accessToken;
          })
          .catch((refreshError: unknown) => {
            if (
              axios.isAxiosError(refreshError) &&
              (refreshError.response?.status === 400 ||
                refreshError.response?.status === 401 ||
                refreshError.response?.status === 403)
            ) {
              localStorage.removeItem(keys.access);
              localStorage.removeItem(keys.refresh);
            }
            return Promise.reject(refreshError);
          })
          .finally(() => pendingRefreshes.delete(keys.refresh));
        pendingRefreshes.set(keys.refresh, refresh);
      }

      try {
        const accessToken = await refresh;
        request.headers.Authorization = `Bearer ${accessToken}`;
        return await client(request);
      } catch (refreshError: unknown) {
        return Promise.reject(refreshError);
      }
    },
  );
}

export function clearAuthSession(keys: SessionKeys): void {
  localStorage.removeItem(keys.access);
  localStorage.removeItem(keys.refresh);
}

function getSessionClient(keys: SessionKeys): AxiosInstance {
  const cached = sessionClients.get(keys.access);
  if (cached) return cached;

  const client = axios.create({
    baseURL: `${apiBaseUrl}/api/auth`,
    headers: { "Content-Type": "application/json" },
  });
  installAuthInterceptors(client, keys);
  sessionClients.set(keys.access, client);
  return client;
}

export async function validateAuthSession(
  keys: SessionKeys,
): Promise<AuthRole | null> {
  if (
    !localStorage.getItem(keys.access) &&
    !localStorage.getItem(keys.refresh)
  ) {
    return null;
  }

  try {
    const response = await getSessionClient(keys).get<{
      user?: { role?: unknown };
    }>("/session");
    const role = response.data.user?.role;
    if (role === "parent" || role === "provider" || role === "admin") {
      return role;
    }
    throw new Error("The session response did not contain a valid user role.");
  } catch (error: unknown) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      clearAuthSession(keys);
      return null;
    }
    throw error;
  }
}
