import { ArrowLeft, CircleCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardFooter from "../parent/components/DashboardFooter";

const termsSections = [
  {
    title: "Using Little Steps",
    body: "Keep your account details accurate, protect your sign-in credentials, and use the platform lawfully. You are responsible for activity made through your account.",
  },
  {
    title: "Childcare listings and bookings",
    body: "Listings, availability, ratings, prices, and booking states must be confirmed with the childcare provider. A request through the platform is not a confirmed placement unless the provider confirms it.",
  },
  {
    title: "Safety and camera access",
    body: "Any camera access, caregiver information, or safety feature must respect provider approval, privacy, and applicable law. Do not record, copy, or share private footage or personal information without authorization.",
  },
  {
    title: "Payments and refunds",
    body: "Payment and refund features shown in the current preview are not connected to a payment processor. No payment is taken and no refund is issued through this demo.",
  },
  {
    title: "Service availability",
    body: "Features may change as the service is developed. We will publish updated terms and effective dates when the production service and related policies are ready.",
  },
];

const TermsPage = () => (
  <div className="flex min-h-screen flex-col bg-[#f6f9f7] text-[#26384b]">
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <Link to="/parent/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#278a70] hover:text-[#1f755f]">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
      <article className="mt-7 overflow-hidden rounded-3xl border border-[#e3ece7] bg-white shadow-sm">
        <header className="border-b border-[#eaf1ed] bg-gradient-to-r from-[#f0f8f4] to-white p-6 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3f3ed] text-[#278a70]">
            <FileText size={23} />
          </span>
          <p className="mt-5 text-sm font-semibold tracking-wide text-[#278a70]">LITTLE STEPS</p>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-[#687a88]">Draft for product preview · Updated November 5, 2026</p>
        </header>
        <div className="space-y-6 p-6 sm:p-10">
          <p className="rounded-xl border border-[#f1e4c9] bg-[#fff9ed] px-4 py-3 text-sm leading-6 text-[#785c31]">
            This page is a draft interface preview, not final legal advice or a substitute for reviewed production terms. Have the final terms reviewed before launch.
          </p>
          {termsSections.map((section) => (
            <section key={section.title} className="border-b border-[#eaf1ed] pb-5 last:border-0 last:pb-0">
              <h2 className="flex items-center gap-2 font-sans text-lg font-extrabold">
                <CircleCheck size={18} className="text-[#278a70]" /> {section.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#687a88]">{section.body}</p>
            </section>
          ))}
          <p className="text-sm text-[#687a88]">
            Questions? Visit <Link className="font-semibold text-[#278a70] hover:underline" to="/contact">Contact us</Link>.
          </p>
        </div>
      </article>
    </main>
    <DashboardFooter />
  </div>
);

export default TermsPage;
