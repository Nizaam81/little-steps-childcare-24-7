import type { ReactNode } from "react";
import AuthRoute from "./AuthRoute";

export default function GuestRoute({ children }: { children: ReactNode }) {
  return <AuthRoute guestOnly>{children}</AuthRoute>;
}
