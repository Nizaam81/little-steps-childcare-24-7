import { ArrowLeft, Eye, FileText, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardFooter from "../parent/components/DashboardFooter";

const privacySections = [
  {
    title: "Information in this preview",
    body: "This frontend uses sample parent, childcare, booking, recommendation, and payment details. Profile edits and demo actions are held in page memory and are not submitted to a dashboard backend.",
    Icon: Eye,
  },
  {
    title: "Location permission",
    body: "The dashboard can request location access through your browser. If granted, coordinates are displayed in the page for this session; the current UI does not send them to a nearby-center service.",
    Icon: MapPin,
  },
  {
    title: "Camera, payments, and recommendations",
    body: "Camera access, caregiver recommendations, payments, and refunds are preview interfaces only. They do not connect to camera streams, AI services, or payment providers.",
    Icon: ShieldCheck,
  },
  {
    title: "Production privacy notice",
    body: "Before launch, replace this preview notice with a policy that accurately explains the production data collected, purposes, lawful basis, retention, service providers, security measures, and how users can exercise their rights.",
    Icon: FileText,
  },
];

const PrivacyPage = () => (
  <div className="flex min-h-screen flex-col bg-[#f6f9f7] text-[#26384b]">
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <Link to="/parent/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#278a70] hover:text-[#1f755f]">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
      <article className="mt-7 overflow-hidden rounded-3xl border border-[#e3ece7] bg-white shadow-sm">
        <header className="border-b border-[#eaf1ed] bg-gradient-to-r from-[#f0f8f4] to-white p-6 sm:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3f3ed] text-[#278a70]">
            <ShieldCheck size={23} />
          </span>
          <p className="mt-5 text-sm font-semibold tracking-wide text-[#278a70]">YOUR PRIVACY MATTERS</p>
          <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy policy</h1>
          <p className="mt-3 text-sm text-[#687a88]">Product preview notice · Updated November 5, 2026</p>
        </header>
        <div className="space-y-6 p-6 sm:p-10">
          <p className="rounded-xl border border-[#f1e4c9] bg-[#fff9ed] px-4 py-3 text-sm leading-6 text-[#785c31]">
            This page describes the current frontend preview and is not a complete production privacy policy. Have the final policy reviewed and update it to match your deployed services before launch.
          </p>
          {privacySections.map(({ title, body, Icon }) => (
            <section key={title} className="border-b border-[#eaf1ed] pb-5 last:border-0 last:pb-0">
              <h2 className="flex items-center gap-2 font-sans text-lg font-extrabold">
                <Icon size={18} className="text-[#278a70]" /> {title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[#687a88]">{body}</p>
            </section>
          ))}
          <p className="text-sm text-[#687a88]">
            For questions, visit <Link className="font-semibold text-[#278a70] hover:underline" to="/contact">Contact us</Link>.
          </p>
        </div>
      </article>
    </main>
    <DashboardFooter />
  </div>
);

export default PrivacyPage;
