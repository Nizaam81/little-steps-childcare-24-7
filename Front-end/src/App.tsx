import { Route, Routes } from "react-router-dom";
import LandingPage from "./Landing_page";
import ParentLogin from "./features/auth/Parent-Login";
import ParentRegistration from "./features/auth/ParentRegistration";
import InformationPage from "./features/pages/InformationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<ParentRegistration />} />
      <Route path="/login" element={<ParentLogin />} />
      <Route
        path="/parent/dashboard"
        element={
          <InformationPage
            title="Welcome to your parent dashboard"
            description="You are signed in. Parent dashboard features are coming soon."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
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
          <InformationPage
            title="Become a provider"
            description="Provider registration will be available when provider onboarding is connected."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
      <Route
        path="  "
        element={
          <InformationPage
            title="Provider login"
            description="Provider sign-in will be available when provider authentication is connected."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
      <Route
        path="/privacy"
        element={
          <InformationPage
            title="Privacy policy"
            description="Privacy information will be published here."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
      <Route
        path="/contact"
        element={
          <InformationPage
            title="Contact us"
            description="Our family support contact information will be published here."
            actionLabel="Back to home"
            actionTo="/"
          />
        }
      />
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