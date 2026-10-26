import { Check, Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import type { ProviderRegistrationResponse } from "./registrationTypes";

type VerificationStepProps = {
  response: ProviderRegistrationResponse;
};

export default function VerificationStep({ response }: VerificationStepProps) {
  return (
    <section className="py-3" aria-labelledby="step-heading">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check size={31} strokeWidth={2.5} aria-hidden="true" />
      </div>
      <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
        06 / Admin verification
      </p>
      <h1
        id="step-heading"
        className="mt-2 text-center text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl"
      >
        Application submitted. Your centre is in the verification queue.
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-slate-500">
        The Little Steps admin team will review your details and documents. We’ll contact you if we need corrections or more information.
      </p>

      <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Application reference
        </p>
        <p className="mt-1 break-all text-lg font-bold text-slate-800">
          {response.applicationId}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <Clock3 size={15} aria-hidden="true" />
          Pending admin verification
        </p>
      </div>

      <ol className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
        <VerificationStatus
          icon={<FileCheck2 size={18} />}
          title="Application received"
          description="Your details and documents have been sent."
          complete
        />
        <VerificationStatus
          icon={<ShieldCheck size={18} />}
          title="Admin review"
          description="Our team checks your centre and licence."
          current
        />
        <VerificationStatus
          icon={<Check size={18} />}
          title="Decision"
          description="We’ll approve, decline or request corrections."
        />
      </ol>
    </section>
  );
}

function VerificationStatus({
  icon,
  title,
  description,
  complete = false,
  current = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  complete?: boolean;
  current?: boolean;
}) {
  return (
    <li
      className={`rounded-xl border p-4 ${
        current
          ? "border-teal-200 bg-teal-50"
          : complete
            ? "border-emerald-100 bg-emerald-50/50"
            : "border-slate-200 bg-white"
      }`}
    >
      <span className={`${complete || current ? "text-teal-800" : "text-slate-400"}`}>
        {icon}
      </span>
      <h2 className="mt-2 text-sm font-bold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </li>
  );
}
