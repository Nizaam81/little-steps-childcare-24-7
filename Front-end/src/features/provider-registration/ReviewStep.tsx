import { ClipboardCheck, FileText, MapPin, UserRound } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { ProviderRegistrationValues } from "./registrationTypes";

type ReviewStepProps = {
  tradeLicense: File | null;
  supportingDocuments: File[];
};

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-5">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="break-words text-sm font-semibold text-slate-800 sm:max-w-[65%] sm:text-right">
        {value || "—"}
      </dd>
    </div>
  );
}

export default function ReviewStep({
  tradeLicense,
  supportingDocuments,
}: ReviewStepProps) {
  const {
    getValues,
    register,
    formState: { errors },
  } = useFormContext<ProviderRegistrationValues>();
  const values = getValues();
  const care = values.careTypes?.join(", ") ?? "";
  const ages = values.ageGroups?.join(", ") ?? "";
  const prices = [
    values.dailyPrice !== "" ? `Daily: ${values.dailyPrice}` : "",
    values.monthlyPrice !== "" ? `Monthly: ${values.monthlyPrice}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-labelledby="step-heading">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
        <ClipboardCheck size={20} />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-teal-800">
        05 / Review and submit
      </p>
      <h1 id="step-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
        Check everything before sending.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Please review your details. You can go back to make changes before submitting.
      </p>

      <div className="mt-7 space-y-4">
        <ReviewCard title="Owner account" icon={<UserRound size={17} />}>
          <ReviewItem label="Name" value={values.ownerName} />
          <ReviewItem label="Email" value={values.ownerEmail} />
          <ReviewItem label="Phone" value={values.ownerPhone} />
        </ReviewCard>
        <ReviewCard title="Daycare centre" icon={<MapPin size={17} />}>
          <ReviewItem label="Centre" value={values.centreName} />
          <ReviewItem label="Address" value={`${values.address}, ${values.district}`} />
          <ReviewItem label="Contact" value={`${values.centreEmail} · ${values.centrePhone}`} />
        </ReviewCard>
        <ReviewCard title="Services and documents" icon={<FileText size={17} />}>
          <ReviewItem label="Age groups" value={ages} />
          <ReviewItem label="Care options" value={care} />
          <ReviewItem label="Places" value={String(values.capacity)} />
          <ReviewItem
            label="Hours"
            value={`${values.openingTime} – ${values.closingTime}`}
          />
          <ReviewItem label="Pricing" value={prices} />
          <ReviewItem label="Trade licence" value={tradeLicense?.name ?? ""} />
          <ReviewItem
            label="Supporting files"
            value={supportingDocuments.map((file) => file.name).join(", ") || "None added"}
          />
        </ReviewCard>
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
          {...register("termsAccepted", {
            required: "Please confirm your details before submitting.",
          })}
        />
        <span>
          I confirm that the information provided is accurate and understand it will be reviewed by the Little Steps admin team.
        </span>
      </label>
      {errors.termsAccepted && (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {errors.termsAccepted.message}
        </p>
      )}
    </section>
  );
}

function ReviewCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className="text-teal-800">{icon}</span>
        {title}
      </h2>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}
