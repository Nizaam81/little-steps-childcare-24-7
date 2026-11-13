import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import LandingPage from "./Landing_page";
import AdminLogin from "./features/admin/AdminLogin";
import AdminDashboard from "./features/admin/AdminDashboard";
import ParentLogin from "./features/auth/Parent-Login";
import ProviderLogin from "./features/auth/ProviderLogin";
import ParentRegistration from "./features/auth/ParentRegistration";
import InformationPage from "./features/pages/InformationPage";
import ContactPage from "./features/pages/ContactPage";
import PrivacyPage from "./features/pages/PrivacyPage";
import TermsPage from "./features/pages/TermsPage";
import ParentDashboard from "./features/parent/Dashbord";
import ProviderDashboard from "./features/provider/ProviderDashboard";

const ProviderRegistration = lazy(
  () => import("./features/provider-registration/ProviderRegistration"),
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<ParentRegistration />} />
      <Route path="/login" element={<ParentLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/parent/dashboard" element={<ParentDashboard />} />
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
      <Route path="/provider/login" element={<ProviderLogin />} />
      <Route path="/provider/dashboard" element={<ProviderDashboard />} />
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
  );
}