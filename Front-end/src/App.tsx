import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./LandingPage";
import AdminLogin from "./features/admin/AdminLogin";
import ParentLogin from "./features/auth/Parent-Login";
import ProviderLogin from "./features/auth/ProviderLogin";
import GuestRoute from "./features/auth/GuestRoute";
import ParentRegistration from "./features/auth/ParentRegistration";
import InformationPage from "./features/pages/InformationPage";
import ContactPage from "./features/pages/ContactPage";
import PrivacyPage from "./features/pages/PrivacyPage";
import TermsPage from "./features/pages/TermsPage";
import ProtectedRoute from "./features/auth/ProtectedRoute";

const ProviderRegistration = lazy(
  () => import("./features/provider-registration/ProviderRegistration"),
);
const ParentDashboard = lazy(() => import("./features/parent/Dashboard"));
const ProviderDashboard = lazy(() => import("./features/provider/ProviderDashboard"));
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard"));

export default function App() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-[#f5f9f7] text-sm font-medium text-slate-600">
        Loading…
      </main>
    }>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<ParentRegistration />} />
        <Route path="/login" element={<GuestRoute><ParentLogin /></GuestRoute>} />
        <Route path="/admin/login" element={<GuestRoute><AdminLogin /></GuestRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/parent/dashboard" element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      <Route
        path="/centers"
        element={
          <InformationPage
            title="Find childcare"
            description="Childcare discovery results will be shown here when the search API is connected."
            actionLabel="Back to home"
            actionTo="/"
            showSearch
          />
        }
      />
      <Route
        path="/trust-and-safety"
        element={
          <InformationPage
            title="Trust & safety"
            description="Learn how Little Steps helps families make informed childcare decisions."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
      <Route
        path="/provider/register"
        element={
          <Suspense
            fallback={
              <main className="flex min-h-screen items-center justify-center bg-[#f5f8f6] text-sm font-medium text-slate-600">
                Loading provider registration...
              </main>
            }
          >
            <ProviderRegistration />
          </Suspense>
        }
      />
      <Route path="/provider/login" element={<GuestRoute><ProviderLogin /></GuestRoute>} />
      <Route path="/provider/dashboard" element={<ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>} />
      <Route
        path="*"
        element={
          <InformationPage
            title="Page not found"
            description="We couldn't find the page you were looking for."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
      </Routes>
    </Suspense>
  );
}