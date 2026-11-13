import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardFooter from "../parent/components/DashboardFooter";
import { siteContact } from "../../config/siteContact";

const ContactPage = () => (
  <div className="flex min-h-screen flex-col bg-[#f6f9f7] text-[#26384b]">
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <Link to="/parent/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#278a70] hover:text-[#1f755f]">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
      <section className="mt-7 rounded-3xl border border-[#e3ece7] bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold tracking-wide text-[#278a70]">WE’RE HERE TO HELP</p>
        <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">Contact Little Steps</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#687a88]">
          For questions about your account or using the platform, contact our support team. For urgent childcare or safety matters, contact your childcare provider or local emergency services directly.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <a href={`mailto:${siteContact.email}`} className="rounded-2xl border border-[#e3ece7] bg-[#fbfdfc] p-5 transition hover:border-[#c5dfd3]">
            <Mail className="text-[#278a70]" size={21} />
            <h2 className="mt-3 font-bold">Email support</h2>
            <p className="mt-1 break-all text-sm text-[#687a88]">{siteContact.email}</p>
          </a>
          <a href={`tel:${siteContact.phone.replaceAll(" ", "")}`} className="rounded-2xl border border-[#e3ece7] bg-[#fbfdfc] p-5 transition hover:border-[#c5dfd3]">
            <Phone className="text-[#278a70]" size={21} />
            <h2 className="mt-3 font-bold">Call support</h2>
            <p className="mt-1 text-sm text-[#687a88]">{siteContact.phone}</p>
          </a>
        </div>
        <p className="mt-5 rounded-xl border border-[#f1e4c9] bg-[#fff9ed] px-4 py-3 text-xs leading-5 text-[#785c31]">
          These are placeholder contact details for the UI preview. Replace them with your verified support email and phone number before publishing.
        </p>
      </section>
    </main>
    <DashboardFooter />
  </div>
);

export default ContactPage;
