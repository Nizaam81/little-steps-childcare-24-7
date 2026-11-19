import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  validateAuthSession,
  type AuthRole,
} from "./authSession";

type AuthRouteProps = {
  children: ReactNode;
  requiredRole?: AuthRole;
  guestOnly?: boolean;
};

const sessionKeys: Record<AuthRole, { access: string; refresh: string }> = {
  parent: { access: "parentToken", refresh: "parentRefreshToken" },
  provider: { access: "providerToken", refresh: "providerRefreshToken" },
  admin: { access: "adminToken", refresh: "adminRefreshToken" },
};

const dashboardPaths: Record<AuthRole, string> = {
  parent: "/parent/dashboard",
  provider: "/provider/dashboard",
  admin: "/admin/dashboard",
};

const loginPaths: Record<AuthRole, string> = {
  parent: "/login",
  provider: "/provider/login",
  admin: "/admin/login",
};

type RouteState =
  | { status: "checking" }
  | { status: "ready"; role: AuthRole | null }
  | { status: "error" };

export default function AuthRoute({
  children,
  requiredRole,
  guestOnly = false,
}: AuthRouteProps) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RouteState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    const keys = requiredRole ? sessionKeys[requiredRole] : sessionKeys.parent;
    void validateAuthSession(keys)
      .then(async (role) => {
        if (guestOnly && !role) {
          for (const candidate of ["provider", "admin"] as const) {
            const candidateRole = await validateAuthSession(sessionKeys[candidate]);
            if (candidateRole) {
              if (active) setState({ status: "ready", role: candidateRole });
              return;
            }
          }
        }
        if (active) setState({ status: "ready", role });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });

    return () => {
      active = false;
    };
  }, [attempt, guestOnly, requiredRole]);

  if (state.status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f9f7] text-sm text-slate-600">
        Checking your session…
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f9f7] px-4 text-center text-sm text-slate-600">
        <p>We couldn’t verify your session. Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "checking" });
            setAttempt((current) => current + 1);
          }}
          className="rounded-lg bg-[#278a70] px-4 py-2 font-semibold text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (guestOnly) {
    return state.role
      ? <Navigate to={dashboardPaths[state.role]} replace />
      : children;
  }

  if (!state.role) {
    return <Navigate to={loginPaths[requiredRole ?? "parent"]} replace />;
  }
  if (requiredRole && state.role !== requiredRole) {
    return <Navigate to={dashboardPaths[state.role]} replace />;
  }
  return children;
}
