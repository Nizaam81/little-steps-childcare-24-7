import type { ReactNode } from "react";
import AuthRoute from "./AuthRoute";

type ProtectedRouteProps = {
  role: "parent" | "provider" | "admin";
  children: ReactNode;
};

export default function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  return <AuthRoute requiredRole={role}>{children}</AuthRoute>;
}
